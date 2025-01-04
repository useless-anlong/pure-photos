import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { remove } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

const appWindow = getCurrentWindow();
const viewer = document.querySelector('.viewer');
const image = document.querySelector('#image');
const imageInfo = document.getElementById('imageInfo');
const exploreFilesBtn = document.querySelector('#explore-files');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const rotateBtn = document.getElementById('rotateBtn');

let currentWidth = 90; // 初始宽度为100%
let currentHeight = 90; // 初始宽度为100%
let currentRotation = 0;

const MAX_WIDTH = 800; // 最大宽度200%
const MIN_WIDTH = 10;  // 最小宽度10%
const MAX_HEIGHT = 800; // 最大宽度200%
const MIN_HEIGHT = 10;  // 最小宽度10%

// 工具按钮状态管理
function toggleToolButtons(enable = false) {
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(btn => {
        if (enable) {
            btn.classList.remove('disabled');
        } else {
            btn.classList.add('disabled');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 初始状态禁用所有按钮
    toggleToolButtons(false);

    function updateImageSize() {
        const containerWidth = viewer.clientWidth;
        const containerHeight = viewer.clientHeight;
        const aspectRatio = image.naturalWidth / image.naturalHeight;

        if (aspectRatio > 1) {
            // 宽图，以宽度为基准
            const baseWidth = containerWidth * (currentWidth / 100);
            image.style.width = `${baseWidth}px`;
            image.style.height = 'auto';
        } else {
            // 高图，以高度为基准
            const baseHeight = containerHeight * (currentHeight / 100);
            image.style.height = `${baseHeight}px`;
            image.style.width = 'auto';
        }
    }

    // 监听图片加载完成
    image.addEventListener('load', updateImageSize);
    
    // 初始更新尺寸
    updateImageSize();
});

const currentWidthContent = document.querySelector('.current-width');

// 放大按钮
zoomInBtn.addEventListener('click', () => {
    const aspectRatio = image.naturalWidth / image.naturalHeight;
    if (aspectRatio > 1) {
        currentWidth = Math.min(MAX_WIDTH, currentWidth + 10); // 每次放大10%
        image.style.width = `${currentWidth}%`;
        image.style.height = 'auto';
        currentWidthContent.textContent = `${currentWidth}%`;
        if (currentHeight > 100) { dragImage(true) } else { dragImage(false) }
    } else {
        currentHeight = Math.min(MAX_HEIGHT, currentHeight + 10); // 每次放大10%
        image.style.height = `${currentHeight}%`;
        image.style.width = 'auto';
        currentWidthContent.textContent = `${currentHeight}%`;
        if (currentHeight > 100) { dragImage(true) } else { dragImage(false) }
    }
    image.style.transform = `rotate(${currentRotation}deg)`;
});

// 缩小按钮
zoomOutBtn.addEventListener('click', () => {
    const aspectRatio = image.naturalWidth / image.naturalHeight;
    if (aspectRatio > 1) {
        currentWidth = Math.max(MIN_WIDTH, currentWidth - 10); // 最小宽度为10%
        image.style.width = `${currentWidth}%`;
        image.style.height = 'auto';
        currentWidthContent.textContent = `${currentWidth}%`;
        if (currentWidth > 100) { dragImage(true) } else { dragImage(false) }
    } else {
        currentHeight = Math.max(MIN_HEIGHT, currentHeight - 10); // 最小高度为10%
        image.style.height = `${currentHeight}%`;
        image.style.width = 'auto';
        currentWidthContent.textContent = `${currentHeight}%`;
        if (currentHeight > 100) { dragImage(true) } else { dragImage(false) }
    }
    image.style.transform = `rotate(${currentRotation}deg)`;
});

// 旋转按钮
rotateBtn.addEventListener('click', () => {
    currentRotation = (currentRotation + 90) % 360;
    image.style.transform = `rotate(${currentRotation}deg)`;
});

// 添加滚轮操作
image.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (event.deltaY > 0) {
        const aspectRatio = image.naturalWidth / image.naturalHeight;
        if (aspectRatio > 1) {
            currentWidth = Math.max(MIN_WIDTH, currentWidth - 10); // 最小宽度为10%
            image.style.width = `${currentWidth}%`;
            image.style.height = 'auto';
            currentWidthContent.textContent = `${currentWidth}%`;
            if (currentWidth > 100) { dragImage(true) } else { dragImage(false) }
        } else {
            currentHeight = Math.max(MIN_HEIGHT, currentHeight - 10); // 最小高度为10%
            image.style.height = `${currentHeight}%`;
            image.style.width = 'auto';
            currentWidthContent.textContent = `${currentHeight}%`;
            if (currentHeight > 100) { dragImage(true) } else { dragImage(false) }
        }
    } else {
        const aspectRatio = image.naturalWidth / image.naturalHeight;
        if (aspectRatio > 1) {
            currentWidth = Math.max(MIN_WIDTH, currentWidth + 10); // 最小宽度为10%
            image.style.width = `${currentWidth}%`;
            image.style.height = 'auto';
            currentWidthContent.textContent = `${currentWidth}%`;
            if (currentWidth > 100) { dragImage(true) } else { dragImage(false) }
        } else {
            currentHeight = Math.max(MIN_HEIGHT, currentHeight + 10); // 最小高度为10%
            image.style.height = `${currentHeight}%`;
            image.style.width = 'auto';
            currentWidthContent.textContent = `${currentHeight}%`;
            if (currentHeight > 100) { dragImage(true) } else { dragImage(false) }
        }
    }
    image.style.transform = `rotate(${currentRotation}deg)`;
    // scaleSlider.value = currentWidth;
});

import { getCurrent } from '@tauri-apps/plugin-deep-link';
const urls = await getCurrent();
console.log('mode 01 - deep link:', urls);

await onOpenUrl((urls) => { console.log('mode 03 - deep link:', urls) });

// 其他应用调起链接传入
await onOpenUrl((urls) => {
    // const container = document.querySelector('.test_deep-link-urls');
    console.log('mode02 - deep link:', urls);
    toggleToolButtons(true);
    // container.innerHTML = `deep link: ${urls}`;
});

// 打开文件对话框
exploreFilesBtn.addEventListener('click', async () => {
    const imgElement = document.querySelector('#image');
    const file = await open({
        multiple: false,
        directory: false,
        open: true,
        filters: [
            { name: 'Images', extensions: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "ico", "heic", "avif"] }
        ]
    });
    // const file = './test.jpeg';
    console.log(file);
    if (file) {
        // 打开图片
        const assetUrl = convertFileSrc(file);
        // 处理图片文件名 & 调整标题栏
        const windowTitle = document.querySelector('.window-title');
        const fileName = file.replace(/^.*[\\\/]/, '');
        const titleFileName = document.querySelector('.title-file-name');
        windowTitle.style.marginTop = '0';
        titleFileName.textContent = `${fileName}`;
        currentWidthContent.textContent = `${currentWidth}%`;
        // 获取文件大小和图片信息
        const response = await fetch(assetUrl);
        const blob = await response.blob();
        // 格式化文件大小
        let fileSize;
        if (blob.size > 1024 * 1024) {
            fileSize = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';
        } else {
            fileSize = (blob.size / 1024).toFixed(2) + ' KB';
        }
        const img = new Image();
        img.src = assetUrl;
        imgElement.style.display = 'block';
        toggleToolButtons(true);
        img.onload = () => {
            const aspectRatio = img.width / img.height;
            document.documentElement.style.setProperty('--image-aspect-ratio', aspectRatio);
            // 分别显示分辨率和文件大小
            const resolutionInfo = document.querySelector('.resolution-info');
            const sizeInfo = document.querySelector('.size-info');
            resolutionInfo.textContent = `${img.width} × ${img.height}`;
            sizeInfo.textContent = fileSize;
        };

        image.src = assetUrl;
        exploreFilesBtn.classList.add('hide');
    }
    // 长按删除按钮
    const timeout = 1000;
    let deleteTimer;
    let isHoldingDeleteButton;
    deleteImageBtn.addEventListener('mousedown', (e) => {
        isHoldingDeleteButton = true;
        deleteTimer = setTimeout(async () => {
            if (file) {
                await remove(file);
                setTimeout(() => {
                    // location.reload()
                    image.src = '';
                    toggleToolButtons(false);
                    imgElement.style.display = 'none';
                    exploreFilesBtn.classList.remove('hide');
                    // 重置标题栏
                    windowTitle.style.marginTop = '1px';
                    titleFileName.textContent = `轻照片`;
                    currentWidthContent.textContent = `未打开图片文件`;
                }, 1800)
            } else {
                alert("No file selected")
            }
        }, timeout);
    });
});

function dragImage(enable = false) {
    const element = document.querySelector(".draggable");

    if (!enable) {
        element.onmousedown = null;
        document.onmouseup = null;
        document.onmousemove = null;
        return;
    }

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }

    element.onmousedown = dragMouseDown;
}


// async function toggleFullscreen() {
//     const isFullscreen = await appWindow.isFullscreen();
//     if (isFullscreen) {
//         await appWindow.setFullscreen(false);
//         title.classList.remove('fullscreen');
//         windowControls.classList.remove('fullscreen');
//         fullScreenBtn.id = 'full-screen-button';
//         fullScreenBtn.title = '全屏模式 (F11)';
//     } else {
//         await appWindow.setFullscreen(true);
//         title.classList.add('fullscreen');
//         windowControls.classList.add('fullscreen');
//         fullScreenBtn.id = 'exit-full-screen-button';
//         fullScreenBtn.title = '退出全屏模式 (F11)';
//     }
// }

// 窗口控制按钮

document
    .getElementById('close-button')
    ?.addEventListener('click', () => appWindow.close());

document
    .getElementById('maximize-button')
    ?.addEventListener('click', async () => {
        const Btn = document.getElementById('maximize-button')
        const isMaximized = await appWindow.isMaximized();
        const maxIcon = document.querySelector('.max-icon');
        const minIcon = document.querySelector('.min-icon');
        if (isMaximized) {
            await appWindow.unmaximize();
            Btn.title = '还原';
            maxIcon.classList.remove('hide');
            minIcon.classList.add('hide');
        } else {
            await appWindow.maximize();
            Btn.title = '最大化';
            maxIcon.classList.add('hide');
            minIcon.classList.remove('hide');
        }
    });

document
    .getElementById('minimize-button')
    ?.addEventListener('click', () => appWindow.minimize());

document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    return false
}, false);
