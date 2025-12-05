// Suppress storage-related errors from extensions
window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('storage')) {
        e.preventDefault();
        return true;
    }
}, true);

window.addEventListener('unhandledrejection', function(e) {
    if (e.reason && e.reason.message && e.reason.message.includes('storage')) {
        e.preventDefault();
        return true;
    }
});

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
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) targetTab.classList.add('active');
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
    
    try {
        const dt = new DataTransfer();
        const files = imageInput.files;
        
        for (let i = 0; i < files.length; i++) {
            if (i !== index) dt.items.add(files[i]);
        }
        
        imageInput.files = dt.files;
        imageInput.dispatchEvent(new Event('change'));
    } catch (error) {
        console.error('Remove image error:', error);
    }
}

// Generate image from text
async function generateImage() {
    const promptEl = document.getElementById('prompt');
    const widthEl = document.getElementById('width');
    const heightEl = document.getElementById('height');
    const guidanceEl = document.getElementById('guidance');
    
    if (!promptEl || !widthEl || !heightEl || !guidanceEl) {
        showError('页面元素未正确加载，请刷新页面');
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
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const error = await response.json();
                    errorMsg = error.error || errorMsg;
                } catch (e) {
                    errorMsg = `HTTP ${response.status}: ${response.statusText}`;
                }
            } else {
                errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }
        
        // Check if response is actually an image
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('返回的不是图片格式，请重试');
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error('返回的图片为空，请重试');
        }
        
        console.log(`Image blob received: ${blob.size} bytes, type: ${blob.type}`);
        displayResult(blob);
    } catch (error) {
        console.error('Generation error:', error);
        showError(error.message || '生成图像时出错，请重试');
        hideLoading();
    }
}

// Generate image with multiple references
async function generateMultiRef() {
    const promptEl = document.getElementById('multi-prompt');
    
    if (!promptEl || !imageInput) {
        showError('页面元素未正确加载，请刷新页面');
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
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const error = await response.json();
                    errorMsg = error.error || errorMsg;
                } catch (e) {
                    errorMsg = `HTTP ${response.status}: ${response.statusText}`;
                }
            } else {
                errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('返回的不是图片格式，请重试');
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error('返回的图片为空，请重试');
        }
        
        console.log(`Multi-ref image blob received: ${blob.size} bytes`);
        displayResult(blob);
    } catch (error) {
        console.error('Multi-ref generation error:', error);
        showError(error.message || '生成图像时出错，请重试');
        hideLoading();
    }
}

// Generate image with JSON control
async function generateJSON() {
    const jsonPromptEl = document.getElementById('json-prompt');
    
    if (!jsonPromptEl) {
        showError('页面元素未正确加载，请刷新页面');
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
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const error = await response.json();
                    errorMsg = error.error || errorMsg;
                } catch (e) {
                    errorMsg = `HTTP ${response.status}: ${response.statusText}`;
                }
            } else {
                errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('返回的不是图片格式，请重试');
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error('返回的图片为空，请重试');
        }
        
        console.log(`JSON image blob received: ${blob.size} bytes`);
        displayResult(blob);
    } catch (error) {
        console.error('JSON generation error:', error);
        showError(error.message || '生成图像时出错，请重试');
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
            try {
                URL.revokeObjectURL(currentImageUrl);
            } catch (e) {
                console.warn('Failed to revoke previous URL:', e);
            }
        }
        
        currentImageBlob = blob;
        currentImageUrl = URL.createObjectURL(blob);
        
        const img = document.getElementById('output-image');
        if (!img) {
            showError('图片元素未找到，请刷新页面');
            hideLoading();
            return;
        }
        
        // Remove previous event listeners
        img.onload = null;
        img.onerror = null;
        
        // Set up new event listeners
        img.onload = function() {
            console.log('✅ Image loaded successfully');
            hideLoading();
            
            const resultEl = document.getElementById('result');
            if (resultEl) {
                resultEl.classList.remove('hidden');
                // Scroll to result after a short delay
                setTimeout(() => {
                    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
        };
        
        img.onerror = function(e) {
            console.error('❌ Failed to load image:', e);
            hideLoading();
            showError('图片加载失败，请重试');
            
            // Clean up
            if (currentImageUrl) {
                try {
                    URL.revokeObjectURL(currentImageUrl);
                } catch (err) {
                    console.warn('Failed to revoke URL:', err);
                }
                currentImageUrl = null;
            }
        };
        
        // Set the image source
        console.log('Setting image source:', currentImageUrl);
        img.src = currentImageUrl;
        
    } catch (error) {
        console.error('Display error:', error);
        showError('显示图片时出错：' + error.message);
        hideLoading();
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
        a.download = `flux-ai-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up after download
        setTimeout(() => {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                console.warn('Failed to revoke download URL:', e);
            }
        }, 100);
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
            try {
                URL.revokeObjectURL(currentImageUrl);
            } catch (e) {
                console.warn('Failed to revoke URL on reset:', e);
            }
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
            img.onload = null;
            img.onerror = null;
            img.src = '';
        }
        
        hideError();
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
        console.error('Error div not found. Message:', message);
        alert(message); // Fallback to alert
        return;
    }
    
    errorDiv.textContent = '❌ ' + message;
    errorDiv.classList.remove('hidden');
    
    // Auto hide error after 8 seconds
    setTimeout(() => {
        hideError();
    }, 8000);
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
            console.warn('Cleanup error:', error);
        }
    }
});

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ FLUX.2 AI Image Generator initialized');
    });
} else {
    console.log('✅ FLUX.2 AI Image Generator initialized');
}
