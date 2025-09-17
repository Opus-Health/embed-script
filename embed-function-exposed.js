(function() {
    // Prevent multiple script loads
    if (window.opusWidgetLoaded) {
        console.log('Opus Widget script already loaded');
        return;
    }
    window.opusWidgetLoaded = true;

    // Extract parameters from script src URL
    function getScriptParams() {
        var scripts = document.getElementsByTagName('script');
        var currentScript = scripts[scripts.length - 1];
        var src = currentScript.src;
        
        if (!src) {
            console.error('Could not find script src URL');
            return { account_id: null, widget_type: 'hsa_calculator' };
        }
        
        try {
            var url = new URL(src);
            var account_id = url.searchParams.get('account_id');
            var widget_type = url.searchParams.get('widget_type') || 'hsa_calculator';
            
            return { account_id: account_id, widget_type: widget_type };
        } catch (error) {
            console.error('Error parsing script URL:', error);
            return { account_id: null, widget_type: 'hsa_calculator' };
        }
    }

    var params = getScriptParams();
    var ACCOUNT_ID = params.account_id;
    var WIDGET_TYPE = params.widget_type;
    
    // Determine iframe src based on widget type
    var IFRAME_SRC;
    if (WIDGET_TYPE === 'hsa_calculator') {
        IFRAME_SRC = 'https://calculator.opushealth.io/expanded';
    } else if (WIDGET_TYPE === 'payment_methods') {
        if (!ACCOUNT_ID) {
            console.error('account_id is required for payment_methods widget type');
            IFRAME_SRC = 'https://calculator.opushealth.io/expanded'; // fallback
        } else {
            IFRAME_SRC = 'https://calculator.opushealth.io/' + ACCOUNT_ID + '/payment_methods';
        }
    } else {
        console.warn('Unknown widget type:', WIDGET_TYPE, 'defaulting to hsa_calculator');
        IFRAME_SRC = 'https://calculator.opushealth.io/expanded';
    }
    
    console.log('Widget params:', { account_id: ACCOUNT_ID, widget_type: WIDGET_TYPE });
    console.log('IFRAME_SRC:', IFRAME_SRC);

    function createLoader() {
        var loader = document.createElement('div');
        loader.className = 'opus-widget-loader';
        loader.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            background: #f9f9f9;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #666;
            font-size: 14px;
        `;
        
        var spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 20px;
            height: 20px;
            border: 2px solid #e0e0e0;
            border-top: 2px solid #007acc;
            border-radius: 50%;
            animation: opus-spin 1s linear infinite;
            margin-right: 10px;
        `;
        
        var text = document.createElement('span');
        text.textContent = 'Loading...';
        
        loader.appendChild(spinner);
        loader.appendChild(text);
        
        // Add CSS animation keyframes if not already added
        if (!document.getElementById('opus-loader-styles')) {
            var styles = document.createElement('style');
            styles.id = 'opus-loader-styles';
            styles.textContent = `
                @keyframes opus-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(styles);
        }
        
        return loader;
    }

    function createWidget() {
        var existing = document.querySelector('[data-opus-widget]');
        if (existing) existing.remove();

        var container = document.createElement('div');
        container.setAttribute('data-opus-widget', 'true');
        container.setAttribute('data-widget-type', WIDGET_TYPE);
        //container.style.cssText = 'margin: 20px 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';

        // Create and show loader first
        var loader = createLoader();
        container.appendChild(loader);

        var iframe = document.createElement('iframe');
        iframe.id = 'opus-widget-iframe-' + Date.now();
        iframe.src = IFRAME_SRC;
        iframe.title = WIDGET_TYPE === 'payment_methods' ? 'Payment Methods' : 'HSA/FSA Savings Calculator';
        iframe.style.cssText = 'width: 100%; height: 200px; border: none; transition: height 0.3s ease-in-out; display: none;';
        iframe.scrolling = 'no';
        iframe.frameBorder = '0';

        // Handle iframe load completion
        iframe.onload = function() {
            loader.remove();
            iframe.style.display = 'block';
            console.log('Iframe loaded, loader removed');
        };

        // Handle iframe load error
        iframe.onerror = function() {
            loader.style.color = '#dc3545';
            loader.querySelector('span').textContent = 'Failed to load widget';
            console.error('Failed to load iframe');
        };

        container.appendChild(iframe);
        var target = document.getElementById('hsa-calculator-placeholder');
        if (target) {
            target.appendChild(container);
        } else {
            document.body.insertBefore(container, document.body.firstChild);
        }
        return iframe;
    }

    function setupResizeHandler(iframe) {
        function handleResize(event) {
            const allowedOrigins = ['https://calculator.opushealth.io', 'http://localhost:5173'];
            if (
                allowedOrigins.includes(event.origin) &&
                event.data?.type === 'RESIZE_IFRAME' &&
                (event.data?.source === 'hsa-calculator' || event.data?.source === 'opus-widget') &&
                typeof event.data.height === 'number'
            ) {
                iframe.style.height = event.data.height + 'px';
                console.log('Opus Widget resized to:', event.data.height + 'px');
            }
        }
        window.addEventListener('message', handleResize, false);
        console.log(`Opus Widget (${WIDGET_TYPE}) loaded → ${IFRAME_SRC}`);
    }

    // Expose the function globally
    window.loadHSACalculator = function() {
        var iframe = createWidget();
        setupResizeHandler(iframe);
        return iframe;
    };

    // Also expose a function to remove the calculator
    window.removeHSACalculator = function() {
        var existing = document.querySelector('[data-opus-widget]');
        if (existing) {
            existing.remove();
            console.log('HSA Calculator removed');
            return true;
        }
        return false;
    };

    console.log('HSA Calculator functions ready. Call window.loadHSACalculator() to add the calculator.');
})();
