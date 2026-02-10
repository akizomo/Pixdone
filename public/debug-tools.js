/**
 * デバッグ・検証ツール
 * 開発効率向上のための統合デバッグシステム
 */

// デバッグ用のヘルパー関数
window.DEBUG = {
    enabled: true,
    
    log: function(component, message, data = null) {
        if (!this.enabled) return;
        console.log(`[${component}] ${message}`, data);
    },
    
    error: function(component, message, error = null) {
        if (!this.enabled) return;
        console.error(`[${component}] ERROR: ${message}`, error);
    },
    
    validateElement: function(id, component) {
        const element = document.getElementById(id);
        if (!element) {
            this.error(component, `Element not found: ${id}`);
            return false;
        }
        return true;
    },
    
    testMobileModal: function() {
        console.log('=== Mobile Modal Test ===');
        
        // 1. 要素の存在確認
        const requiredElements = [
            'mobileModal',
            'mobileModalTitle', 
            'mobileModalClose',
            'mobileTaskTitle',
            'mobileTaskDetails',
            'mobileSaveBtn',
            'mobileCancelBtn'
        ];
        
        const missing = requiredElements.filter(id => !document.getElementById(id));
        if (missing.length > 0) {
            this.error('MobileModal', 'Missing elements:', missing);
            return false;
        }
        
        this.log('MobileModal', 'All elements found');
        
        // 2. 表示テスト
        const modal = document.getElementById('mobileModal');
        modal.style.display = 'block';
        this.log('MobileModal', 'Display test:', modal.style.display);
        
        // 3. 非表示テスト
        setTimeout(() => {
            modal.style.display = 'none';
            this.log('MobileModal', 'Hide test:', modal.style.display);
        }, 1000);
        
        return true;
    },
    
    checkCSS: function() {
        const modal = document.getElementById('mobileModal');
        if (!modal) return;
        
        const styles = window.getComputedStyle(modal);
        console.log('Modal CSS:', {
            display: styles.display,
            position: styles.position,
            zIndex: styles.zIndex,
            width: styles.width,
            height: styles.height
        });
    },
    
    forceShowModal: function() {
        const modal = document.getElementById('mobileModal');
        if (!modal) {
            console.error('Modal not found');
            return;
        }
        
        modal.style.display = 'block';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.zIndex = '9999';
        modal.style.background = '#f5f5f5';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        
        console.log('Modal forced to show');
        console.log('Modal computed styles:', {
            display: window.getComputedStyle(modal).display,
            position: window.getComputedStyle(modal).position,
            visibility: window.getComputedStyle(modal).visibility,
            opacity: window.getComputedStyle(modal).opacity,
            zIndex: window.getComputedStyle(modal).zIndex
        });
    }
};

// テスト用のコンソール関数
window.testModal = () => DEBUG.testMobileModal();
window.showModal = () => DEBUG.forceShowModal();
window.checkCSS = () => DEBUG.checkCSS();
window.testElements = () => {
    const requiredElements = [
        'mobileModal',
        'mobileModalTitle', 
        'mobileModalClose',
        'mobileTaskTitle',
        'mobileTaskDetails',
        'mobileSaveBtn',
        'mobileCancelBtn'
    ];
    
    console.log('Element test results:');
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}: ${element ? 'found' : 'NOT FOUND'}`);
    });
};

// 新しいコンポーネントシステムのテスト
window.testNewSystem = () => {
    console.log('Testing new component system...');
    
    if (!window.componentManager) {
        console.error('Component manager not available');
        return;
    }
    
    // コンポーネント一覧を表示
    console.log('Available components:');
    window.componentManager.components.forEach((component, name) => {
        console.log(`- ${name}: ${component.element ? 'OK' : 'ERROR'}`);
    });
    
    // 新システムの詳細テスト
    if (window.testNewSystemModal) {
        window.testNewSystemModal();
    }
    
    // 自動修復機能
    if (window.fixNewSystemModal) {
        console.log('Applying automatic fixes...');
        window.fixNewSystemModal();
    }
};