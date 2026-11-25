# 练习 02：编写你的第一个 CUDA Kernel

**时长：** 3 小时
**难度：** 中级
**前置条件：** 练习 01；nvcc 编译器

## 目标

为逐元素向量运算编写 CUDA C Kernel，与 PyTorch 内置实现进行基准测试，然后将同一 Kernel 转换为可以从 Python 调用的自定义 PyTorch CUDA 扩展。完成后，你将理解 Kernel → 宿主端代码 → Python 绑定的完整链路。

## 为什么重要

PyTorch 能处理绝大部分机器学习运算，但剩余需要自定义 Kernel 的场景（新的 Attention 变体、特殊损失函数、领域专用操作），决定了团队能否撰写机器学习系统论文，或突破现有库的热点路径性能限制。

## 要求

实现三个组件：

1. **CUDA C Kernel**：`vector_add.cu`，对浮点数组执行 `c = a + b`。
2. **基准测试框架**：针对长度为 1 万、100 万、1 亿的向量，将你的 Kernel 与 `torch.add` 比较。
3. **PyTorch CUDA 扩展**：调用你的 Kernel，并以 `my_ops.add(a, b)` 的形式暴露。

## 分步操作

### 步骤 1——独立 CUDA Kernel（45 分钟）
```cuda
// vector_add.cu
__global__ void add_kernel(int n, const float* a, const float* b, float* c) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) c[i] = a[i] + b[i];
}

extern "C" void launch_add(int n, const float* a, const float* b, float* c) {
    int block = 256;
    int grid = (n + block - 1) / block;
    add_kernel<<<grid, block>>>(n, a, b, c);
    cudaDeviceSynchronize();
}
```
编译并运行独立测试。

### 步骤 2——通过 setup.py 构建 PyTorch 扩展（45 分钟）
```python
# setup.py
from setuptools import setup
from torch.utils.cpp_extension import BuildExtension, CUDAExtension

setup(
    name="my_ops",
    ext_modules=[
        CUDAExtension(
            name="my_ops",
            sources=["my_ops.cpp", "vector_add.cu"],
        )
    ],
    cmdclass={"build_ext": BuildExtension},
)
```

```cpp
// my_ops.cpp
#include <torch/extension.h>

void launch_add(int n, const float* a, const float* b, float* c);

torch::Tensor add(torch::Tensor a, torch::Tensor b) {
    TORCH_CHECK(a.device().is_cuda(), "a must be CUDA");
    TORCH_CHECK(a.sizes() == b.sizes());
    auto c = torch::empty_like(a);
    launch_add(a.numel(), a.data_ptr<float>(), b.data_ptr<float>(), c.data_ptr<float>());
    return c;
}

PYBIND11_MODULE(TORCH_EXTENSION_NAME, m) {
    m.def("add", &add, "vector add (CUDA)");
}
```

```bash
pip install -e .
```

### 步骤 3——从 Python 使用（15 分钟）
```python
import torch, my_ops
a = torch.randn(1_000_000, device="cuda")
b = torch.randn_like(a)
c = my_ops.add(a, b)
torch.testing.assert_close(c, a + b)
```

### 步骤 4——基准测试（45 分钟）
```python
import torch, time, my_ops

def bench(fn, *args, iters=100):
    # warm
    for _ in range(5): fn(*args); torch.cuda.synchronize()
    t0 = time.perf_counter()
    for _ in range(iters): fn(*args); torch.cuda.synchronize()
    return (time.perf_counter() - t0) / iters * 1000  # ms

for n in (10_000, 1_000_000, 100_000_000):
    a = torch.randn(n, device="cuda"); b = torch.randn_like(a)
    my_ms    = bench(my_ops.add, a, b)
    torch_ms = bench(torch.add,  a, b)
    print(f"n={n:>10}  my={my_ms:.3f}ms torch={torch_ms:.3f}ms ratio={torch_ms/my_ms:.2f}x")
```

通常会看到，在小规模输入时（开销占主导），PyTorch 与自定义 Kernel 性能相近；在大规模输入时，PyTorch 略占优势（更好的启动配置及融合）。

### 步骤 5——优化（30 分钟）
- 尝试 Block Size 128、256、512、1024。
- 对指针使用 `__restrict__` 限定符。
- 对受显存带宽限制的 Kernel 使用向量化加载（`float4`）。

### 步骤 6——使用 nsys/ncu 分析性能（30 分钟）
```bash
nsys profile python bench.py
ncu --set basic python -c 'import my_ops, torch; my_ops.add(torch.randn(1<<20,device="cuda"),torch.randn(1<<20,device="cuda"))'
```
观察 Kernel 占用率、显存带宽利用率、每线程寄存器数量。

## 交付物

1. 独立 `vector_add.cu` 与 `my_ops` PyTorch 扩展。
2. 可复现的基准测试脚本 `bench.py`。
3. `BENCHMARK.md` 结果表格与解释。
4. `OPTIMIZATION_NOTES.md`，描述每项优化及其实测效果。

## 验证

- [ ] `my_ops.add` 的输出与 `torch.add` 在浮点误差范围内一致。
- [ ] 三种输入规模的基准测试均无崩溃。
- [ ] 至少记录一项产生可测量改善的优化（或可测量的性能退化，两者均是有效发现）。

## 拓展目标

- 实现**融合 Kernel**：`c = relu(a + b)`，使其优于朴素 `torch.relu(a + b)`（后者会生成中间张量）。
- 为真实机器学习运算编写 Kernel：**softmax**、**layernorm** 或 **causal mask**。与 Apex / Triton 等价实现比较。
- 使用 **Triton**（Python DSL）替代 CUDA C，对比开发体验。

## 常见陷阱

- **最后一个 Block 越界读取**——始终在 Kernel 内检查 `if (i < n) {}`。
- **忘记 `cudaDeviceSynchronize`**——Kernel 启动是异步的，不同步会导致计时不准确。
- **`pip install -e` 编译错误**——确认已设置 `CUDA_HOME`，且与 torch 的 CUDA 版本匹配。
- **PyTorch CUDA Stream 混淆**——直接启动自定义 Kernel 可能使用默认 Stream，而 PyTorch 运算使用当前 Stream。高吞吐代码应显式管理。

## 参考答案

engineer-solutions 仓库中的参考实现包含 Triton 版本。
