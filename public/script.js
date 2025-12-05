// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// Image preview
const imageInput = document.getElementById('images');
const previewContainer = document.getElementById('preview-container');

if (imageInput && previewContainer) {
    imageInput.addEventListener('change', (e) => {
        previewContainer.innerHTML = '';
        const files = Array.from(e.target.files).slice(0, 4);
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index}">
                    <button class="remove-btn" onclick="removeImage(${index})">×</button>
                `;
                previewContainer.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    });
}

function removeImage(index) {
    if (!imageInput) return;
    
    const dt = new DataTransfer();
    const files = imageInput.files;
    
    for (let i = 0; i < files.length; i++) {
        if (i !== index) dt.items.add(files[i]);
    }
    
    imageInput.files = dt.files;
    imageInput.dispatchEvent(new Event('change'));
}

// Generate image from text
async function generateImage() {
    const promptEl = document.getElementById('prompt');
    const widthEl = document.getElementById('width');
    const heightEl = document.getElementById('height');
    const guidanceEl = document.getElementById('guidance');
    
    if (!promptEl || !widthEl || !heightEl || !guidanceEl) {
        showError('页面元素未正确加载');
        return;
    }
    
    const prompt = promptEl.value.trim();
    const width = parseInt(widthEl.value);
    const height = parseInt(heightEl.value);
    const guidance = parseFloat(guidanceEl.value);
    
    if (!prompt) {
        showError('请输入提示词');
        return;
    }
    
    showLoading();
    hideError();
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt, width, height, guidance })
        });
        
        if (!response.ok) {
            let errorMsg = '生成失败';
            try {
                const error = await response.json();
                errorMsg = error.error || errorMsg;
            } catch (e) {
                errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }
        
        // Check if response is actually an image
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('返回的不是图片格式');
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error('返回的图片为空');
        }
        
        displayResult(blob);
    } catch (error) {
        console.error('Generation error:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Generate image with multiple references
async function generateMultiRef() {
    const promptEl = document.getElementById('multi-prompt');
    
    if (!promptEl || !imageInput) {
        showError('页面元素未正确加载');
        return;
    }
    
    const prompt = promptEl.value.trim();
    const files = imageInput.files;
    
    if (!prompt) {
        showError('请输入提示词');
        return;
    }
    
    if (!files.length) {
        showError('请至少上传一张参考图片');
        return;
    }
    
    if (files.length > 4) {
        showError('最多只能上传 4 张图片');
        return;
    }
    
    showLoading();
    hideError();
    
    try {
        const formData = new FormData();
        formData.append('prompt', prompt);
        
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }
        
        const response = await fetch('/api/generate/multi', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            let errorMsg = '生成失败';
            try {
                const error = await response.json();
                errorMsg = error.error || errorMsg;
            } catch (e) {
                errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }
        
        // Check if response is actually an image
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('返回的不是图片格式');
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error('返回的图片为空');
        }
        
        displayResult(blob);
    } catch (error) {
        console.error('Multi-ref generation error:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Generate image with JSON control
async function generateJSON() {
    const jsonPromptEl = document.getElementById('json-prompt');
    
    if (!jsonPromptEl) {
        showError('页面元素未正确加载');
        return;
    }
    
    const jsonText = jsonPromptEl.value.trim();
    
    if (!jsonText) {
        showError('请输入 JSON 提示词');
        return;
    }
    
    let jsonPrompt;
    try {
        jsonPrompt = JSON.parse(jsonText);
    } catch (e) {
        showError('JSON 格式错误：' + e.message);
        return;
    }
    
    showLoading();
    hideError();
    
    try {
        const response = await fetch('/api/generate/json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jsonPrompt })
        });
        
        if (!response.ok) {
            let errorMsg = '生成失败';
            try {
                const error = await response.json();
                errorMsg = error.error || errorMsg;
            } catch (e) {
                errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }
        
        // Check if response is actually an image
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('返回的不是图片格式');
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error('返回的图片为空');
        }
        
        displayResult(blob);
    } catch (error) {
        console.error('JSON generation error:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Display result
let currentImageBlob = null;
let currentImageUrl = null;

function displayResult(blob) {
    try {
        // Clean up previous URL if exists
        if (currentImageUrl) {
            URL.revokeObjectURL(currentImageUrl);
        }
        
        currentImageBlob = blob;
        currentImageUrl = URL.createObjectURL(blob);
        
        const img = document.getElementById('output-image');
        if (!img) {
            showError('图片元素未找到');
            return;
        }
        
        // Add load event listener
        img.onload = () => {
            console.log('Image loaded successfully');
            const resultEl = document.getElementById('result');
            if (resultEl) {
                resultEl.classList.remove('hidden');
                // Scroll to result
                setTimeout(() => {
                    resultEl.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        };
        
        img.onerror = () => {
            console.error('Failed to load image');
            showError('图片加载失败，请重试');
            hideLoading();
        };
        
        // Set the image source
        img.src = currentImageUrl;
    } catch (error) {
        console.error('Display error:', error);
        showError('显示图片时出错：' + error.message);
    }
}

// Download image
function downloadImage() {
    if (!currentImageBlob) {
        showError('没有可下载的图片');
        return;
    }
    
    try {
        const url = URL.createObjectURL(currentImageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flux-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download error:', error);
        showError('下载失败：' + error.message);
    }
}

// Reset form
function resetForm() {
    try {
        // Clean up blob URL
        if (currentImageUrl) {
            URL.revokeObjectURL(currentImageUrl);
            currentImageUrl = null;
        }
        
        const resultEl = document.getElementById('result');
        if (resultEl) {
            resultEl.classList.add('hidden');
        }
        
        currentImageBlob = null;
        
        // Clear the image
        const img = document.getElementById('output-image');
        if (img) {
            img.src = '';
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Reset error:', error);
    }
}

// Show/hide loading
function showLoading() {
    const loadingEl = document.getElementById('loading');
    const resultEl = document.getElementById('result');
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (resultEl) resultEl.classList.add('hidden');
}

function hideLoading() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.classList.add('hidden');
}

// Show/hide error
function showError(message) {
    const errorDiv = document.getElementById('error');
    if (!errorDiv) {
        console.error('Error div not found:', message);
        return;
    }
    
    errorDiv.textContent = '❌ ' + message;
    errorDiv.classList.remove('hidden');
    
    // Auto hide error after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (currentImageUrl) {
        try {
            URL.revokeObjectURL(currentImageUrl);
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
});

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('FLUX.2 AI Image Generator initialized');
    });
} else {
    console.log('FLUX.2 AI Image Generator initialized');
}
