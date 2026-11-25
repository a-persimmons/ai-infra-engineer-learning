# 练习 11：构建自定义 Kubernetes Operator

**时长：** 4 小时
**难度：** 高级
**前置条件：** 已安装 Kubebuilder；熟悉 Go。

## 目标

使用 Kubebuilder 构建 Kubernetes Operator，管理 `ModelDeployment` CRD。Operator 将每个 `ModelDeployment` 协调为 Deployment + Service + HPA + ServiceMonitor。

## 为什么重要

Operator 将运维知识（「如何部署模型？」）编码为程序。编写完成后，每个模型都按照相同方式部署，不需要复制粘贴。相较手动编写清单的团队，构建 Operator 的团队可获得数量级的效率提升。

## 要求

1. CRD `ModelDeployment`，具有 spec.image、spec.replicas、spec.modelVersion、spec.resources。
2. Controller 将其协调为 Deployment、Service、HPA、ServiceMonitor。
3. 状态更新：副本数、condition（Healthy/Progressing/Failed）、lastModelChange。
4. 删除时清理资源的 Finalizer。
5. 使用 envtest 编写测试。

## 分步操作

### 步骤 1——生成脚手架（30 分钟）
```bash
kubebuilder init --domain example.com --repo example.com/model-operator
kubebuilder create api --group ml --version v1alpha1 --kind ModelDeployment
```

### 步骤 2——定义 CRD 类型（30 分钟）
```go
// api/v1alpha1/modeldeployment_types.go
type ModelDeploymentSpec struct {
    Image        string                       `json:"image"`
    ModelVersion string                       `json:"modelVersion"`
    Replicas     *int32                       `json:"replicas,omitempty"`
    Resources    corev1.ResourceRequirements  `json:"resources,omitempty"`
}

type ModelDeploymentStatus struct {
    ReadyReplicas    int32              `json:"readyReplicas"`
    Conditions       []metav1.Condition `json:"conditions,omitempty"`
    LastModelChange  metav1.Time        `json:"lastModelChange,omitempty"`
}
```

### 步骤 3——Reconcile 循环（90 分钟）
```go
// internal/controller/modeldeployment_controller.go
func (r *ModelDeploymentReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var md mlv1alpha1.ModelDeployment
    if err := r.Get(ctx, req.NamespacedName, &md); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }
    
    // 1. Build desired Deployment from md.Spec
    desiredDep := buildDeployment(&md)
    if err := r.applyOwned(ctx, &md, desiredDep); err != nil { return ctrl.Result{}, err }
    
    // 2. Service
    desiredSvc := buildService(&md)
    if err := r.applyOwned(ctx, &md, desiredSvc); err != nil { return ctrl.Result{}, err }
    
    // 3. HPA
    desiredHPA := buildHPA(&md)
    if err := r.applyOwned(ctx, &md, desiredHPA); err != nil { return ctrl.Result{}, err }
    
    // 4. ServiceMonitor (if monitoring CRDs present)
    desiredSM := buildServiceMonitor(&md)
    if err := r.applyOwned(ctx, &md, desiredSM); err != nil { return ctrl.Result{}, err }
    
    // Update status
    return ctrl.Result{}, r.updateStatus(ctx, &md)
}
```

### 步骤 4——Finalizer（15 分钟）
```go
const finalizerName = "modeldeployment.ml.example.com/finalizer"

// In Reconcile:
if md.DeletionTimestamp != nil {
    if controllerutil.ContainsFinalizer(&md, finalizerName) {
        // cleanup: delete owned PVCs, S3 objects, etc.
        controllerutil.RemoveFinalizer(&md, finalizerName)
        return ctrl.Result{}, r.Update(ctx, &md)
    }
    return ctrl.Result{}, nil
}
if !controllerutil.ContainsFinalizer(&md, finalizerName) {
    controllerutil.AddFinalizer(&md, finalizerName)
    return ctrl.Result{}, r.Update(ctx, &md)
}
```

### 步骤 5——使用 envtest 测试（45 分钟）
```go
// internal/controller/modeldeployment_controller_test.go
var _ = Describe("ModelDeployment controller", func() {
    It("creates a Deployment", func() {
        md := &mlv1alpha1.ModelDeployment{...}
        Expect(k8sClient.Create(ctx, md)).Should(Succeed())
        
        depKey := types.NamespacedName{Name: md.Name, Namespace: md.Namespace}
        var dep appsv1.Deployment
        Eventually(func() error { return k8sClient.Get(ctx, depKey, &dep) },
                   time.Second*10, time.Millisecond*100).Should(Succeed())
    })
})
```

### 步骤 6——部署并尝试运行（30 分钟）
```bash
make manifests install
make run                    # local controller against cluster
# In another terminal:
kubectl apply -f - <<EOF
apiVersion: ml.example.com/v1alpha1
kind: ModelDeployment
metadata: { name: iris }
spec:
  image: iris-api:0.2
  modelVersion: v3.2.1
  replicas: 3
EOF

kubectl get all -l ml.example.com/model=iris
kubectl get modeldeployment iris -o yaml   # status populated
```

## 交付物

1. Operator 源代码（位于 `controllers/` 与 `api/`）。
2. 已安装 CRD。
3. 至少一个创建全部子资源的 `ModelDeployment` 资源。
4. envtest 测试通过。
5. `OPERATOR_DESIGN.md`，解释协调机制的设计理念。

## 验证

- [ ] 创建 ModelDeployment 会创建 Deployment + Service + HPA +（可选）ServiceMonitor。
- [ ] 编辑 ModelDeployment 的 `image` 会触发滚动发布。
- [ ] 删除 ModelDeployment 会移除全部子资源。
- [ ] 测试通过。

## 拓展目标

- 添加 **Webhook 验证**：在准入阶段拒绝 spec 无效的 ModelDeployment。
- 为 CRD 添加 **OpenAPI Schema** 验证。
- 通过 `r.Recorder.Event(...)` 发送 **Event**。

## 常见陷阱

- **Reconcile 循环无限更新**——重复应用所属资源可能触发另一次 Reconcile。使用 apply patch，或先检查语义是否相等。
- **忘记 OwnerReference**——删除父资源后遗留孤立资源。始终通过 `controllerutil.SetControllerReference` 设置所有者引用。
- **Finalizer 永远不移除**——资源一直处于 Terminating 状态。应测试删除路径。
