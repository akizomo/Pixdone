// DOM要素の詳細デバッグ用スクリプト
console.log('DOM Debug Script Loaded');

// 即座に実行
setTimeout(() => {
    console.log('=== DOM Debug Check ===');
    console.log('Document ready state:', document.readyState);
    
    // 全ての要素をチェック
    const elements = [
        'mobileModal',
        'mobileModalTitle',
        'mobileModalClose',
        'mobileTaskTitle',
        'mobileTaskDetails',
        'mobileSaveBtn',
        'mobileCancelBtn'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✓ ${id}: Found`);
            console.log(`  - TagName: ${element.tagName}`);
            console.log(`  - Classes: ${element.className}`);
            console.log(`  - Parent: ${element.parentElement?.tagName || 'null'}`);
        } else {
            console.log(`✗ ${id}: NOT FOUND`);
        }
    });
    
    // モバイルモーダル全体の構造をチェック
    const mobileModal = document.querySelector('#mobileModal');
    if (mobileModal) {
        console.log('Mobile modal found, analyzing structure...');
        console.log('All child elements with IDs:');
        
        const allElements = mobileModal.querySelectorAll('[id]');
        allElements.forEach(el => {
            console.log(`  - ${el.id} (${el.tagName})`);
        });
    } else {
        console.log('Mobile modal NOT found in DOM');
    }
    
    // 全体のDOM構造をチェック
    const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
    console.log('All IDs in document:', allIds);
    
}, 2000);

// グローバル関数として追加
window.debugDOM = () => {
    console.log('=== Manual DOM Debug ===');
    const mobileModal = document.getElementById('mobileModal');
    console.log('Mobile modal:', mobileModal);
    if (mobileModal) {
        console.log('Modal innerHTML:', mobileModal.innerHTML);
    }
    
    // 必要な要素を直接確認
    const requiredElements = [
        'mobileModalTitle',
        'mobileTaskTitle',
        'mobileTaskDetails',
        'mobileSaveBtn',
        'mobileCancelBtn'
    ];
    
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, element);
    });
};