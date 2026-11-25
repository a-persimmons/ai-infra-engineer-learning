# 实验 01：CUDA Hello World 与设备信息查询

**时长：** 45 分钟  **前置条件：** NVIDIA GPU，并已安装 CUDA Toolkit。

## 目标

验证 CUDA 工具链正常工作，编写并编译一个最小 CUDA 内核（kernel），以编程方式查询设备属性。

## 步骤

### 1. 验证工具链
```bash
nvidia-smi                 # GPU detected
nvcc --version             # CUDA compiler installed
```

### 2. 最小内核：向量加法
```cuda
// vector_add.cu
#include <cstdio>

__global__ void add(int n, const float *x, const float *y, float *out) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) out[i] = x[i] + y[i];
}

int main() {
    const int N = 1 << 20;
    size_t bytes = N * sizeof(float);
    float *x_h = (float*)malloc(bytes), *y_h = (float*)malloc(bytes), *o_h = (float*)malloc(bytes);
    for (int i = 0; i < N; i++) { x_h[i] = 1.0f; y_h[i] = 2.0f; }

    float *x, *y, *o;
    cudaMalloc(&x, bytes); cudaMalloc(&y, bytes); cudaMalloc(&o, bytes);
    cudaMemcpy(x, x_h, bytes, cudaMemcpyHostToDevice);
    cudaMemcpy(y, y_h, bytes, cudaMemcpyHostToDevice);

    int block = 256, grid = (N + block - 1) / block;
    add<<<grid, block>>>(N, x, y, o);
    cudaDeviceSynchronize();

    cudaMemcpy(o_h, o, bytes, cudaMemcpyDeviceToHost);
    printf("o[0]=%f o[N-1]=%f\n", o_h[0], o_h[N-1]);

    cudaFree(x); cudaFree(y); cudaFree(o);
    free(x_h); free(y_h); free(o_h);
    return 0;
}
```
```bash
nvcc -O2 -o vector_add vector_add.cu
./vector_add
# Expected: o[0]=3.000000 o[N-1]=3.000000
```

### 3. 查询设备信息
```cuda
// device_info.cu
#include <cstdio>
int main() {
    int n; cudaGetDeviceCount(&n);
    for (int i = 0; i < n; ++i) {
        cudaDeviceProp p; cudaGetDeviceProperties(&p, i);
        printf("device %d: %s\n", i, p.name);
        printf("  compute cap: %d.%d\n", p.major, p.minor);
        printf("  global mem:  %.2f GB\n", p.totalGlobalMem / 1e9);
        printf("  SMs:         %d\n", p.multiProcessorCount);
        printf("  max threads/block: %d\n", p.maxThreadsPerBlock);
    }
}
```
```bash
nvcc -o device_info device_info.cu && ./device_info
```

### 4. 使用 nsys 进行性能分析
```bash
nsys profile --stats=true ./vector_add
```
关注内核执行时间与内存复制（memcpy）时间的对比。

## 验证

- [ ] `nvidia-smi` 显示你的 GPU。
- [ ] `vector_add` 对第一个和最后一个元素均输出 `3.0`。
- [ ] `device_info` 列出至少一个设备。
- [ ] `nsys` 统计结果中包含实际 CUDA API 调用。

## 清理
```bash
rm vector_add device_info *.cu
```

## 故障排查

- **`nvcc: command not found`** — 安装 CUDA Toolkit，将 `/usr/local/cuda/bin` 加入 PATH。
- **`no CUDA-capable device is detected`** — 驱动未加载；在 Linux 上执行 `sudo modprobe nvidia`。
- **内核返回错误值** — 检查 grid/block 维度计算；当 N=1M（1,048,576）且 block=256 时，grid 应为 4096。
