import { invoke, convertFileSrc } from '@tauri-apps/api/core';
// import { open } from '@tauri-apps/plugin-dialog';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
// import { open as openInExplorer } from '@tauri-apps/plugin-shell';
import { remove } from '@tauri-apps/plugin-fs';
// import { appDataDir, join } from '@tauri-apps/api/path';
// import { getCurrentWindow, getAll, getCurrent, Window } from '@tauri-apps/api/window';
import { getCurrentWindow, Window } from '@tauri-apps/api/window';
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

// 定义滚动处理函数
const handleScroll = () => {
    if (image) {
        const imgRect = image.getBoundingClientRect();
        const headerOpacity = imgRect.top <= 38 ? 1 : 0;
        document.documentElement.style.setProperty('--header-background-opacity', headerOpacity);
        // console.log('headerOpacity:', headerOpacity, 'imgRect.top:', imgRect.top);
    }
};

function setupLongPressDelete(deleteButton, file, options) {
    const {
        timeout = 1000,
        onDeleteSuccess = () => { },
    } = options;

    let deleteTimer;
    let isHoldingDeleteButton;

    deleteButton.addEventListener('mousedown', () => {
        isHoldingDeleteButton = true;
        deleteTimer = setTimeout(async () => {
            if (isHoldingDeleteButton && file) {
                await remove(file);
                onDeleteSuccess();
            }
        }, timeout);
    });

    deleteButton.addEventListener('mouseup', () => {
        isHoldingDeleteButton = false;
        clearTimeout(deleteTimer);
    });

    deleteButton.addEventListener('mouseleave', () => {
        isHoldingDeleteButton = false;
        clearTimeout(deleteTimer);
    });
}

const currentWidthContent = document.querySelector('.current-width');

// 统一的缩放处理函数
function handleZoom(isZoomIn) {
    const aspectRatio = image.naturalWidth / image.naturalHeight;
    const zoomDelta = 10; // 缩放步长

    if (aspectRatio > 1) {
        // 宽图处理
        const newWidth = isZoomIn
            ? Math.min(MAX_WIDTH, currentWidth + zoomDelta)
            : Math.max(MIN_WIDTH, currentWidth - zoomDelta);

        currentWidth = newWidth;
        image.style.width = `${currentWidth}%`;
        image.style.height = 'auto';
        currentWidthContent.textContent = `${currentWidth}%`;
        dragImage(currentWidth > 100);
    } else {
        // 高图处理
        const newHeight = isZoomIn
            ? Math.min(MAX_HEIGHT, currentHeight + zoomDelta)
            : Math.max(MIN_HEIGHT, currentHeight - zoomDelta);

        currentHeight = newHeight;
        image.style.height = `${currentHeight}%`;
        image.style.width = 'auto';
        currentWidthContent.textContent = `${currentHeight}%`;
        dragImage(currentHeight > 100);
    }

    image.style.transform = `rotate(${currentRotation}deg)`;
    handleScroll();
}

// 修改放大按钮事件处理
zoomInBtn.addEventListener('click', () => handleZoom(true));

// 修改缩小按钮事件处理
zoomOutBtn.addEventListener('click', () => handleZoom(false));

// 修改滚轮事件处理
image.addEventListener('wheel', (event) => {
    event.preventDefault();
    handleZoom(event.deltaY < 0);
});

// 旋转按钮
rotateBtn.addEventListener('click', () => {
    currentRotation = (currentRotation + 90) % 360;
    image.style.transform = `rotate(${currentRotation}deg)`;
});

// 在适当的位置添加滚动监听（比如初始化时）
window.addEventListener('scroll', handleScroll);

// import { getCurrent } from '@tauri-apps/plugin-deep-link';
// const urls = await getCurrent();
// console.log('mode 01 - deep link:', urls);

await onOpenUrl((urls) => { console.log('mode 03 - deep link:', urls) });

// 其他应用调起链接传入
await onOpenUrl((urls) => {
    // const container = document.querySelector('.test_deep-link-urls');
    console.log('mode02 - deep link:', urls);
    toggleToolButtons(true);
    // container.innerHTML = `deep link: ${urls}`;
});

const titleFileName = document.querySelector('.title-file-name');
const windowTitle = document.querySelector('.window-title');

// 打开文件对话框
async function handleFileOpen() {
    const imgElement = document.querySelector('#image');
    const file = await openDialog({
        multiple: false,
        directory: false,
        open: true,
        filters: [
            { name: 'Images', extensions: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "heic", "avif"] }
        ]
    });
    // const file = './test.jpeg';
    console.log(file);
    if (file) {
        // 打开图片
        const assetUrl = convertFileSrc(file);
        // 处理图片文件名 & 调整标题栏
        const fileName = file.replace(/^.*[\\\/]/, '');
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
        img.crossOrigin = "anonymous";
        img.src = assetUrl;
        imgElement.style.display = 'block';
        toggleToolButtons(true);

        // 图片加载完成事件
        img.onload = () => {
            const aspectRatio = img.width / img.height;
            document.documentElement.style.setProperty('--image-aspect-ratio', aspectRatio);

            // 创建离屏canvas分析图片
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // 获取色彩位数和DPI
            const imageData = ctx.getImageData(0, 0, 1, 1);
            const hasAlpha = imageData.data[3] !== 255;
            const colorDepth = hasAlpha ? '32 (RGBA)' : '24 (RGB)';
            const dpi = Math.round(window.devicePixelRatio * 96);

            // 更新所有信息显示
            const resolutionInfo = document.querySelector('.resolution-info');
            const sizeInfo = document.querySelector('.size-info');
            const colorDepthInfo = document.querySelector('.color-depth-info');
            const dpiInfo = document.querySelector('.dpi-info');
            const imageFilePath = document.querySelector('.image-file-path');

            resolutionInfo.textContent = `${img.width}×${img.height}`;
            sizeInfo.textContent = fileSize;
            colorDepthInfo.textContent = colorDepth;
            dpiInfo.textContent = `${dpi} DPI`;

            const pathOnly = file.replace(/[^\\]*$/, '\...');
            imageFilePath.textContent = pathOnly;
            // 存储完整路径
            imageFilePath.setAttribute('data-full-path', file);

            handleScroll();
        };

        image.src = assetUrl;
        exploreFilesBtn.classList.add('hide');
    }
    // 浏览文件目录按钮
    const openAtExplorerBtn = document.querySelector('.open-at-explorer-btn');
    // openAtExplorerBtn.addEventListener('click', async () => {
    //     await openInExplorer('explorer', [' /select, "', file, '"']);
    // });
    // openAtExplorerBtn.addEventListener('click', async () => {
    //     await openInExplorer(file);
    // });
    openAtExplorerBtn.addEventListener('click', async () => {
        await invoke('show_in_folder', { path: file });
    });
    // 长按删除按钮
    setupLongPressDelete(deleteImageBtn, file, {
        timeout: 1000,
        onDeleteSuccess: () => {
            setTimeout(() => {
                image.src = '';
                toggleToolButtons(false);
                imgElement.style.display = 'none';
                exploreFilesBtn.classList.remove('hide');
                // 重置标题栏
                windowTitle.style.marginTop = '1px';
                titleFileName.textContent = `轻照片`;
                currentWidthContent.textContent = `未打开图片文件`;
                // 隐藏删除对话框
                const flyout = document.querySelector(`#delete-flyout`);
                const button = document.querySelector(`#deleteFlyoutBtn`);
                if (flyout.classList.contains('active')) {
                    flyout.classList.remove('active');
                    button.classList.remove('active');
                    setTimeout(() => {
                        flyout.classList.remove('fade-out-animate');
                    }, 200);
                }
            }, 1800);
        }
    });
};

exploreFilesBtn.addEventListener('click', handleFileOpen);
document.querySelector('.explore-image-btn').addEventListener('click', handleFileOpen);

function dragImage(enable = false) {
    const viewer = document.querySelector(".viewer");
    const image = document.querySelector("#image");

    // 添加元素存在性检查
    if (!viewer || !image) {
        console.warn('未找到必要的DOM元素');
        return;
    }

    if (!enable) {
        viewer.style.overflow = 'hidden';
        image.style.cursor = 'default';
        return;
    }

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    function handleDragStart(e) {
        isDragging = true;
        image.style.cursor = 'grabbing';

        startX = e.clientX;
        startY = e.clientY;
        scrollLeft = viewer.scrollLeft;
        scrollTop = viewer.scrollTop;
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        // 计算鼠标移动的距离
        const moveX = e.clientX - startX;
        const moveY = e.clientY - startY;

        // 反向设置滚动位置（鼠标向右移动，内容向左滚动）
        viewer.scrollLeft = scrollLeft - moveX;
        viewer.scrollTop = scrollTop - moveY;
    }

    function handleDragEnd() {
        isDragging = false;
        image.style.cursor = 'grab';
    }

    viewer.style.overflow = 'auto';
    image.style.cursor = 'grab';

    image.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('mouseleave', handleDragEnd);
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

// 创建关于窗口
// async function createAboutWindow() {
//     const appWindow = new Window('app-about');

//     appWindow.once('tauri://created', function () {
//         // 窗口创建成功后显示窗口
//         appWindow.show();
//         console.log('窗口创建成功')
//     });
//     appWindow.once('tauri://error', function (e) {
//         // 发生错误创建窗口时销毁窗口实例
//         appWindow.destroy();
//         console.log('窗口创建时出错：', e)
//     });

//     // emit an event to the backend
//     await appWindow.emit("some-event", "data");
//     // listen to an event from the backend
//     const unlisten = await appWindow.listen("event-name", e => { });
//     unlisten();
// }
async function createAboutWindow() {
    const windowOptions = {
        label: 'app-about',
        url: 'about.html',
        width: 600,
        height: 400,
        resizable: true,
        title: '关于窗口'
    };
    const appWindow = new Window('app-about', windowOptions);

    appWindow.once('tauri://created', function () {
        appWindow.show();
        console.log('窗口创建成功');
    });
    appWindow.once('tauri://error', function (e) {
        appWindow.destroy();
        console.log('窗口创建时出错：', e);
    });

    // emit an event to the backend
    await appWindow.emit("some-event", "data");
    // listen to an event from the backend
    const unlisten = await appWindow.listen("event-name", e => { });
    unlisten();
}

document.querySelector('.about-btn').addEventListener('click', createAboutWindow);