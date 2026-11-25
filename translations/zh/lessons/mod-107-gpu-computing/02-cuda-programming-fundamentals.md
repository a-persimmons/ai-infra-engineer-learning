# 第 02 课：CUDA 编程基础

## 学习目标

完成本课后，你将能够：

1. 理解 CUDA 编程模型及执行层次结构。
2. 解释线程组织方式（Grid、Block、Warp、Thread）。
3. 管理主机（CPU）与设备（GPU）之间的内存传输。
4. 为简单运算编写基础 CUDA Kernel。
5. 理解 PyTorch 如何在底层使用 CUDA。
6. 调试常见 CUDA 编程问题。

## 导论

尽管 PyTorch 等框架抽象了大部分 CUDA 编程细节，理解 CUDA 基础仍然有助于：

- 在需要时编写自定义 GPU 运算。
- 优化 PyTorch 代码。
- 调试 GPU 相关问题。
- 理解性能特征。

## CUDA 编程模型

### 主机（Host）与设备（Device）

```
┌─────────────────────┐         ┌─────────────────────┐
│      Host (CPU)     │  PCIe   │    Device (GPU)     │
│                     │◄───────►│                     │
│  - Program control  │         │  - Parallel compute │
│  - Serial code      │         │  - Kernel execution │
│  - CPU memory (RAM) │         │  - GPU memory (VRAM)│
└─────────────────────┘         └─────────────────────┘

Host:   Runs main program, launches kernels
Device: Executes kernels in parallel
```

### CUDA C++ 基础

```cpp
// CUDA program structure
#include <cuda_runtime.h>

// Kernel definition (runs on GPU)
__global__ void myKernel(float* data, int n) {
    // GPU code here
}

int main() {
    // Host code (CPU)

    // 1. Allocate GPU memory
    float* d_data;
    cudaMalloc(&d_data, n * sizeof(float));

    // 2. Copy data to GPU
    cudaMemcpy(d_data, h_data, n * sizeof(float), cudaMemcpyHostToDevice);

    // 3. Launch kernel
    myKernel<<<blocks, threads>>>(d_data, n);

    // 4. Copy results back
    cudaMemcpy(h_result, d_data, n * sizeof(float), cudaMemcpyDeviceToHost);

    // 5. Free GPU memory
    cudaFree(d_data);

    return 0;
}
```

### CUDA 函数限定符

```cpp
// __global__: Kernel function (called from host, runs on device)
__global__ void kernelFunc() {
    // Executed on GPU
    // Called from CPU
}

// __device__: Device function (called from device, runs on device)
__device__ float deviceFunc(float x) {
    // Helper function executed on GPU
    // Called from GPU code only
    return x * x;
}

// __host__: Host function (default for regular C++ functions)
__host__ void hostFunc() {
    // Executed on CPU
}

// Can combine __host__ and __device__
__host__ __device__ float bothFunc(float x) {
    // Compiled for both CPU and GPU
    return x + 1.0f;
}
```

## 线程层次结构

CUDA 通过三个层级组织线程：

```
┌─────────────────────────────────────────────────────┐
│                       Grid                          │
│  ┌────────────────┐  ┌────────────────┐            │
│  │  Block (0,0)   │  │  Block (1,0)   │  ...       │
│  │ ┌──┐┌──┐┌──┐  │  │ ┌──┐┌──┐┌──┐  │            │
│  │ │T0││T1││T2│  │  │ │T0││T1││T2│  │            │
│  │ └──┘└──┘└──┘  │  │ └──┘└──┘└──┘  │            │
│  │ ┌──┐┌──┐┌──┐  │  │ ┌──┐┌──┐┌──┐  │            │
│  │ │T3││T4││T5│  │  │ │T3││T4││T5│  │            │
│  │ └──┘└──┘└──┘  │  │ └──┘└──┘└──┘  │            │
│  └────────────────┘  └────────────────┘            │
│  ┌────────────────┐  ┌────────────────┐            │
│  │  Block (0,1)   │  │  Block (1,1)   │  ...       │
│  │ ┌──┐┌──┐┌──┐  │  │ ┌──┐┌──┐┌──┐  │            │
│  │ │T0││T1││T2│  │  │ │T0││T1││T2│  │            │
│  │ └──┘└──┘└──┘  │  │ └──┘└──┘└──┘  │            │
│  │ ┌──┐┌──┐┌──┐  │  │ ┌──┐┌──┐┌──┐  │            │
│  │ │T3││T4││T5│  │  │ │T3││T4││T5│  │            │
│  │ └──┘└──┘└──┘  │  │ └──┘└──┘└──┘  │            │
│  └────────────────┘  └────────────────┘            │
└─────────────────────────────────────────────────────┘

Grid:   Collection of blocks
Block:  Collection of threads (up to 1024 threads)
Thread: Individual execution unit
```

### 内置变量

CUDA 提供用于识别线程的内置变量：

```cpp
__global__ void kernel() {
    // Thread indices within block
    int tx = threadIdx.x;  // Thread X index (0 to blockDim.x-1)
    int ty = threadIdx.y;  // Thread Y index
    int tz = threadIdx.z;  // Thread Z index

    // Block indices within grid
    int bx = blockIdx.x;   // Block X index
    int by = blockIdx.y;   // Block Y index
    int bz = blockIdx.z;   // Block Z index

    // Block dimensions
    int bdx = blockDim.x;  // Block size in X dimension
    int bdy = blockDim.y;  // Block size in Y dimension
    int bdz = blockDim.z;  // Block size in Z dimension

    // Grid dimensions
    int gdx = gridDim.x;   // Grid size in X dimension
    int gdy = gridDim.y;   // Grid size in Y dimension
    int gdz = gridDim.z;   // Grid size in Z dimension

    // Calculate global thread ID
    int global_idx = blockIdx.x * blockDim.x + threadIdx.x;
}
```

### 示例：一维线程索引

```cpp
// Add two arrays: c[i] = a[i] + b[i]
__global__ void vectorAdd(float* a, float* b, float* c, int n) {
    // Calculate global thread index
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    // Check bounds
    if (i < n) {
        c[i] = a[i] + b[i];
    }
}

// Launch configuration
int n = 1000000;  // 1 million elements
int threadsPerBlock = 256;
int blocksPerGrid = (n + threadsPerBlock - 1) / threadsPerBlock;

// Launch kernel
vectorAdd<<<blocksPerGrid, threadsPerBlock>>>(d_a, d_b, d_c, n);

/*
Execution breakdown:
- blocksPerGrid = (1,000,000 + 255) / 256 = 3907 blocks
- Each block has 256 threads
- Total threads = 3907 * 256 = 1,000,192 threads
- Thread 0 processes element 0
- Thread 1 processes element 1
- ...
- Thread 999,999 processes element 999,999
- Threads 1,000,000 to 1,000,191 do nothing (i >= n check)
*/
```

### 示例：二维线程索引

```cpp
// Matrix addition: C = A + B
__global__ void matrixAdd(float* A, float* B, float* C, int width, int height) {
    // Calculate 2D indices
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    int row = blockIdx.y * blockDim.y + threadIdx.y;

    // Calculate 1D index (row-major order)
    int idx = row * width + col;

    // Check bounds
    if (row < height && col < width) {
        C[idx] = A[idx] + B[idx];
    }
}

// Launch configuration (2D)
dim3 threadsPerBlock(16, 16);  // 16x16 = 256 threads per block
dim3 blocksPerGrid(
    (width + 15) / 16,   // X dimension
    (height + 15) / 16   // Y dimension
);

// Launch kernel
matrixAdd<<<blocksPerGrid, threadsPerBlock>>>(d_A, d_B, d_C, width, height);
```

## Warp 与 SIMT 执行

### 什么是 Warp？

**Warp（线程束）** 是一组共同执行的 32 个线程：

```
Block (256 threads) = 8 Warps
┌────────────────────────────────┐
│ Warp 0:  Threads 0-31          │ Execute together
├────────────────────────────────┤
│ Warp 1:  Threads 32-63         │ Execute together
├────────────────────────────────┤
│ Warp 2:  Threads 64-95         │ Execute together
├────────────────────────────────┤
│ ...                            │
├────────────────────────────────┤
│ Warp 7:  Threads 224-255       │ Execute together
└────────────────────────────────┘

All threads in a warp execute the same instruction
at the same time (SIMT - Single Instruction, Multiple Threads)
```

### Warp 分歧（Warp Divergence）

```cpp
__global__ void divergenceExample(int* data, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        // WARP DIVERGENCE: Some threads in warp take if, some take else
        if (data[i] > 0) {
            data[i] = data[i] * 2;      // Some threads execute this
        } else {
            data[i] = data[i] * 3;      // Other threads execute this
        }
    }
}

/*
When warp divergence occurs:
1. Threads that take 'if' branch execute, others wait
2. Then threads that take 'else' branch execute, others wait
3. Execution time = sum of both branches
4. Performance penalty!

Best practice: Minimize divergence within warps
*/
```

### 避免 Warp 分歧

```cpp
// GOOD: All threads in warp take same path
__global__ void noDivergence(int* data, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        // Process data uniformly
        data[i] = data[i] * 2;
    }
}

// GOOD: Divergence happens across warps, not within
__global__ void goodDivergence(int* data, int n, int threshold) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    // Entire warps take same branch (if threshold aligned with warp size)
    if (i < threshold) {
        data[i] *= 2;
    } else if (i < n) {
        data[i] *= 3;
    }
}
```

## 内存管理

### 内存类型

```cpp
// Global Memory (VRAM) - largest, slowest
__global__ void kernel(float* globalMem) {
    // Accessible by all threads
    // Persists across kernel launches
    // ~400 cycle latency
    float value = globalMem[0];
}

// Shared Memory - fast, limited size
__global__ void sharedMemKernel() {
    // Declare shared memory (per-block)
    __shared__ float sharedMem[256];

    // Accessible by all threads in block
    // ~10 cycle latency
    // Limited to ~48KB per block
    sharedMem[threadIdx.x] = threadIdx.x;
    __syncthreads();  // Synchronize block threads
}

// Registers - fastest, very limited
__global__ void registerKernel() {
    // Local variables stored in registers
    // Per-thread, private
    // ~1 cycle latency
    float reg1 = 1.0f;
    float reg2 = 2.0f;
}

// Constant Memory - read-only, cached
__constant__ float constMem[256];

__global__ void constKernel() {
    // Fast reads, cached
    // Must be read-only
    float value = constMem[0];
}
```

### 主机与设备之间的内存传输

```cpp
#include <cuda_runtime.h>

int main() {
    int n = 1000;
    size_t bytes = n * sizeof(float);

    // 1. Allocate host (CPU) memory
    float* h_data = (float*)malloc(bytes);

    // 2. Allocate device (GPU) memory
    float* d_data;
    cudaMalloc(&d_data, bytes);

    // 3. Initialize host data
    for (int i = 0; i < n; i++) {
        h_data[i] = i;
    }

    // 4. Copy host → device
    cudaMemcpy(d_data, h_data, bytes, cudaMemcpyHostToDevice);

    // 5. Launch kernel
    // kernel<<<blocks, threads>>>(d_data);

    // 6. Copy device → host
    cudaMemcpy(h_data, d_data, bytes, cudaMemcpyDeviceToHost);

    // 7. Free memory
    cudaFree(d_data);
    free(h_data);

    return 0;
}
```

### 锁页内存（Pinned Memory）

```cpp
// Regular pageable memory (slow transfers)
float* h_data = (float*)malloc(bytes);

// Pinned (page-locked) memory (2-3x faster transfers)
float* h_pinned;
cudaMallocHost(&h_pinned, bytes);  // or cudaHostAlloc()

// Transfer is faster because:
// - Memory cannot be paged out
// - DMA (Direct Memory Access) can be used
// - Asynchronous transfers possible

// Copy with pinned memory
cudaMemcpy(d_data, h_pinned, bytes, cudaMemcpyHostToDevice);

// Free pinned memory
cudaFreeHost(h_pinned);

/*
Trade-off:
+ Faster transfers
- Limited resource (pins physical RAM)
- Can impact system performance if overused
*/
```

### 统一内存（Unified Memory）

```cpp
// Unified Memory: Single pointer for CPU and GPU
float* unified_data;
cudaMallocManaged(&unified_data, bytes);

// Can access from CPU
for (int i = 0; i < n; i++) {
    unified_data[i] = i;
}

// Can access from GPU
kernel<<<blocks, threads>>>(unified_data);

// Can access from CPU again (automatic migration!)
cudaDeviceSynchronize();  // Wait for GPU
float result = unified_data[0];

// Free
cudaFree(unified_data);

/*
Benefits:
+ Simplified code (no explicit transfers)
+ Automatic migration
+ Page faulting handles oversubscription

Drawbacks:
- Performance overhead (page faults)
- Less control over transfers
- Best for prototyping, not production
*/
```

## 编写 CUDA Kernel

### 示例 1：向量加法

```cpp
// Kernel: Add two vectors
__global__ void vectorAdd(const float* a, const float* b, float* c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        c[i] = a[i] + b[i];
    }
}

// Host code
void runVectorAdd(int n) {
    size_t bytes = n * sizeof(float);

    // Allocate and initialize host memory
    float *h_a, *h_b, *h_c;
    h_a = (float*)malloc(bytes);
    h_b = (float*)malloc(bytes);
    h_c = (float*)malloc(bytes);

    // Initialize
    for (int i = 0; i < n; i++) {
        h_a[i] = i;
        h_b[i] = i * 2;
    }

    // Allocate device memory
    float *d_a, *d_b, *d_c;
    cudaMalloc(&d_a, bytes);
    cudaMalloc(&d_b, bytes);
    cudaMalloc(&d_c, bytes);

    // Copy to device
    cudaMemcpy(d_a, h_a, bytes, cudaMemcpyHostToDevice);
    cudaMemcpy(d_b, h_b, bytes, cudaMemcpyHostToDevice);

    // Launch kernel
    int threadsPerBlock = 256;
    int blocksPerGrid = (n + threadsPerBlock - 1) / threadsPerBlock;
    vectorAdd<<<blocksPerGrid, threadsPerBlock>>>(d_a, d_b, d_c, n);

    // Copy result back
    cudaMemcpy(h_c, d_c, bytes, cudaMemcpyDeviceToHost);

    // Verify result
    for (int i = 0; i < 10; i++) {
        printf("c[%d] = %.2f\n", i, h_c[i]);
    }

    // Cleanup
    cudaFree(d_a); cudaFree(d_b); cudaFree(d_c);
    free(h_a); free(h_b); free(h_c);
}
```

### 示例 2：矩阵乘法（朴素实现）

```cpp
// Naive matrix multiplication: C = A * B
// A: M x K, B: K x N, C: M x N
__global__ void matMulNaive(
    const float* A,
    const float* B,
    float* C,
    int M, int K, int N
) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;

    if (row < M && col < N) {
        float sum = 0.0f;

        // Dot product of row and column
        for (int k = 0; k < K; k++) {
            sum += A[row * K + k] * B[k * N + col];
        }

        C[row * N + col] = sum;
    }
}

// Launch
dim3 threadsPerBlock(16, 16);
dim3 blocksPerGrid(
    (N + 15) / 16,
    (M + 15) / 16
);
matMulNaive<<<blocksPerGrid, threadsPerBlock>>>(d_A, d_B, d_C, M, K, N);
```

### 示例 3：使用共享内存优化

```cpp
// Tiled matrix multiplication using shared memory
__global__ void matMulShared(
    const float* A,
    const float* B,
    float* C,
    int M, int K, int N
) {
    // Tile size = blockDim.x = blockDim.y
    const int TILE_SIZE = 16;

    // Shared memory for tiles
    __shared__ float As[TILE_SIZE][TILE_SIZE];
    __shared__ float Bs[TILE_SIZE][TILE_SIZE];

    int row = blockIdx.y * TILE_SIZE + threadIdx.y;
    int col = blockIdx.x * TILE_SIZE + threadIdx.x;

    float sum = 0.0f;

    // Loop over tiles
    for (int t = 0; t < (K + TILE_SIZE - 1) / TILE_SIZE; t++) {
        // Load tiles into shared memory
        if (row < M && t * TILE_SIZE + threadIdx.x < K) {
            As[threadIdx.y][threadIdx.x] = A[row * K + t * TILE_SIZE + threadIdx.x];
        } else {
            As[threadIdx.y][threadIdx.x] = 0.0f;
        }

        if (col < N && t * TILE_SIZE + threadIdx.y < K) {
            Bs[threadIdx.y][threadIdx.x] = B[(t * TILE_SIZE + threadIdx.y) * N + col];
        } else {
            Bs[threadIdx.y][threadIdx.x] = 0.0f;
        }

        __syncthreads();  // Wait for all threads to load

        // Compute partial dot product using shared memory
        for (int k = 0; k < TILE_SIZE; k++) {
            sum += As[threadIdx.y][k] * Bs[k][threadIdx.x];
        }

        __syncthreads();  // Wait before loading next tile
    }

    // Write result
    if (row < M && col < N) {
        C[row * N + col] = sum;
    }
}

/*
Performance improvement:
- Naive: Each thread reads from global memory K times
- Shared: Each thread reads from global memory ~K/TILE_SIZE times,
          rest from fast shared memory
- Speedup: ~10-15x for large matrices!
*/
```

## 错误检查

始终检查 CUDA 错误：

```cpp
// Macro for checking CUDA errors
#define CUDA_CHECK(call) \
    do { \
        cudaError_t err = call; \
        if (err != cudaSuccess) { \
            fprintf(stderr, "CUDA error in %s:%d: %s\n", \
                    __FILE__, __LINE__, cudaGetErrorString(err)); \
            exit(EXIT_FAILURE); \
        } \
    } while(0)

// Usage
CUDA_CHECK(cudaMalloc(&d_data, bytes));
CUDA_CHECK(cudaMemcpy(d_data, h_data, bytes, cudaMemcpyHostToDevice));

// Check kernel launch
kernel<<<blocks, threads>>>(d_data);
CUDA_CHECK(cudaGetLastError());  // Check for launch errors
CUDA_CHECK(cudaDeviceSynchronize());  // Wait and check for execution errors
```

## PyTorch 中的 CUDA

### PyTorch 如何使用 CUDA

```python
import torch

# PyTorch provides high-level CUDA interface
x = torch.randn(1000, 1000)

# Move to GPU
x_gpu = x.cuda()  # or x.to('cuda')

# PyTorch automatically:
# 1. Allocates GPU memory
# 2. Copies data to GPU
# 3. Uses optimized CUDA kernels for operations
# 4. Manages memory lifecycle

# Operations run on GPU
y = x_gpu + 1.0
z = torch.mm(x_gpu, x_gpu)  # Matrix multiplication

# Check where tensor lives
print(x_gpu.device)  # cuda:0
print(x_gpu.is_cuda)  # True
```

### PyTorch 中的自定义 CUDA Kernel

可以编写自定义 CUDA 运算：

```python
from torch.utils.cpp_extension import load_inline

# CUDA kernel code
cuda_source = '''
__global__ void add_kernel(const float* a, const float* b, float* c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        c[i] = a[i] + b[i];
    }
}

torch::Tensor add_cuda(torch::Tensor a, torch::Tensor b) {
    auto c = torch::empty_like(a);
    int n = a.numel();
    int threads = 256;
    int blocks = (n + threads - 1) / threads;

    add_kernel<<<blocks, threads>>>(
        a.data_ptr<float>(),
        b.data_ptr<float>(),
        c.data_ptr<float>(),
        n
    );

    return c;
}
'''

cpp_source = "torch::Tensor add_cuda(torch::Tensor a, torch::Tensor b);"

# Compile and load
module = load_inline(
    name='custom_add',
    cpp_sources=cpp_source,
    cuda_sources=cuda_source,
    functions=['add_cuda'],
    verbose=True
)

# Use custom kernel
a = torch.randn(1000).cuda()
b = torch.randn(1000).cuda()
c = module.add_cuda(a, b)
```

## 常见 CUDA 模式

### 归约（Reduction，求和）

```cpp
__global__ void reduceSum(float* input, float* output, int n) {
    __shared__ float sdata[256];

    int tid = threadIdx.x;
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    // Load data into shared memory
    sdata[tid] = (i < n) ? input[i] : 0.0f;
    __syncthreads();

    // Reduction in shared memory
    for (int s = blockDim.x / 2; s > 0; s >>= 1) {
        if (tid < s) {
            sdata[tid] += sdata[tid + s];
        }
        __syncthreads();
    }

    // Write result for this block
    if (tid == 0) {
        output[blockIdx.x] = sdata[0];
    }
}
```

### 扫描（Scan，前缀和）

```cpp
__global__ void scanInclusive(float* input, float* output, int n) {
    __shared__ float temp[256];

    int tid = threadIdx.x;
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    // Load input
    temp[tid] = (i < n) ? input[i] : 0.0f;
    __syncthreads();

    // Up-sweep (reduce)
    for (int stride = 1; stride < blockDim.x; stride *= 2) {
        int index = (tid + 1) * stride * 2 - 1;
        if (index < blockDim.x) {
            temp[index] += temp[index - stride];
        }
        __syncthreads();
    }

    // Down-sweep
    for (int stride = blockDim.x / 2; stride > 0; stride /= 2) {
        int index = (tid + 1) * stride * 2 - 1;
        if (index + stride < blockDim.x) {
            temp[index + stride] += temp[index];
        }
        __syncthreads();
    }

    // Write output
    if (i < n) {
        output[i] = temp[tid];
    }
}
```

## 调试 CUDA 代码

### 在 Kernel 中使用 printf

```cpp
__global__ void debugKernel(float* data, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < 10) {  // Limit output
        printf("Thread %d: data[%d] = %.2f\n", i, i, data[i]);
    }

    if (i < n) {
        data[i] *= 2.0f;
    }
}
```

### CUDA-MEMCHECK

```bash
# Check for memory errors
cuda-memcheck ./my_program

# Common errors detected:
# - Out of bounds access
# - Uninitialized memory
# - Race conditions
# - Memory leaks
```

### Compute-Sanitizer（较新的工具）

```bash
# Memory checker
compute-sanitizer --tool memcheck ./program

# Race condition detector
compute-sanitizer --tool racecheck ./program

# Initialization checker
compute-sanitizer --tool initcheck ./program
```

## 性能优化建议

1. **尽量减少主机与设备之间的数据传输**
   - 数据传输可能较慢（PCIe 瓶颈）。
   - 尽可能让数据保留在 GPU 上。

2. **合并内存访问（Coalesced Memory Access）**
   - 相邻线程访问相邻内存位置。
   - 支持高效的内存事务。

3. **避免 Warp 分歧**
   - 尽量让同一 Warp 内的线程执行相同代码路径。
   - 组织数据，减少分支。

4. **使用共享内存**
   - 原文举例比全局内存快 10–100 倍。
   - 减少全局内存访问。

5. **占用率（Occupancy）**
   - 使用足够的 Block 与 Thread，使 GPU 保持忙碌。
   - 平衡寄存器、共享内存与占用率。

6. **异步执行**
   - 将数据传输与计算重叠。
   - 使用 CUDA Stream。

## 实践练习

### 练习 1：向量缩放

实现一个将向量乘以常数的 Kernel：

```cpp
// TODO: Implement kernel
__global__ void vectorScale(float* data, float scale, int n) {
    // Your code here
    // Multiply each element by scale
}

// Test
int n = 1000000;
float scale = 2.5f;

// TODO: Allocate memory
// TODO: Initialize data
// TODO: Copy to device
// TODO: Launch kernel
vectorScale<<<blocks, threads>>>(d_data, scale, n);
// TODO: Copy back and verify
```

### 练习 2：矩阵转置

```cpp
// TODO: Implement matrix transpose
__global__ void matrixTranspose(
    const float* input,
    float* output,
    int rows,
    int cols
) {
    // Your code here
    // output[col * rows + row] = input[row * cols + col]
}
```

### 练习 3：点积

```cpp
// TODO: Implement dot product with reduction
__global__ void dotProduct(
    const float* a,
    const float* b,
    float* partial_sums,
    int n
) {
    // Your code here
    // Use shared memory for reduction
}
```

## 总结

本课学习了：

1. **CUDA 编程模型：** 主机/设备执行、Kernel 启动。
2. **线程层次结构：** Grid、Block、Warp、Thread。
3. **内存管理：** 主机/设备数据传输、内存类型。
4. **编写 Kernel：** 基础 Kernel 模式与优化。
5. **PyTorch 中的 CUDA：** 框架如何利用 CUDA。
6. **调试：** CUDA 开发工具及技术。

## 核心要点

- **Warp 中的线程共同执行**——尽量避免 Warp 内部分歧。
- **内存层次结构很重要**——通过共享内存改善性能。
- **合并内存访问至关重要**——让相邻线程访问相邻内存位置。
- **PyTorch 抽象了 CUDA**——理解底层仍有助于优化。
- **始终检查错误**——CUDA 错误可能不会立即显现。

## 延伸阅读

- [CUDA C++ 编程指南](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)
- [CUDA 最佳实践指南](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/)
- [PyTorch CUDA 扩展](https://pytorch.org/tutorials/advanced/cpp_extension.html)
- [Professional CUDA C Programming](https://www.oreilly.com/library/view/professional-cuda-c/9781118739310/)

## 下一步

下一课 **PyTorch GPU 加速** 将探索如何在 PyTorch 中高效使用 GPU 进行训练与推理，包括混合精度训练和显存优化。

---

**准备加速 PyTorch 模型了吗？接下来深入 GPU 优化。**

> 译注：Warp 分歧、共享内存和合并访存的收益取决于实际架构及访问模式；高占用率不必然等同于高性能。现代 CUDA 架构支持独立线程调度，仍需正确使用同步原语。CUDA 异步错误可能在后续同步操作中暴露，基准测试应正确同步。保留全部原始代码块及英文注释，未实际编译或执行。
