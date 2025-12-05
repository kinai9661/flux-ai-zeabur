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

function removeImage(index) {
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
    const prompt = document.getElementById('prompt').value.trim();
    const width = parseInt(document.getElementById('width').value);
    const height = parseInt(document.getElementById('height').value);
    const guidance = parseFloat(document.getElementById('guidance').value);
    
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
            const error = await response.json();
            throw new Error(error.error || '生成失败');
        }
        
        const blob = await response.blob();
        displayResult(blob);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Generate image with multiple references
async function generateMultiRef() {
    const prompt = document.getElementById('multi-prompt').value.trim();
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
            const error = await response.json();
            throw new Error(error.error || '生成失败');
        }
        
        const blob = await response.blob();
        displayResult(blob);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Generate image with JSON control
async function generateJSON() {
    const jsonText = document.getElementById('json-prompt').value.trim();
    
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
            const error = await response.json();
            throw new Error(error.error || '生成失败');
        }
        
        const blob = await response.blob();
        displayResult(blob);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Display result
let currentImageBlob = null;

function displayResult(blob) {
    currentImageBlob = blob;
    const url = URL.createObjectURL(blob);
    
    const img = document.getElementById('output-image');
    img.src = url;
    
    document.getElementById('result').classList.remove('hidden');
    
    // Scroll to result
    document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
}

// Download image
function downloadImage() {
    if (!currentImageBlob) return;
    
    const url = URL.createObjectURL(currentImageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flux-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Reset form
function resetForm() {
    document.getElementById('result').classList.add('hidden');
    currentImageBlob = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show/hide loading
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('result').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

// Show/hide error
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '❌ ' + message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}
