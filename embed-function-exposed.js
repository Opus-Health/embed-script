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

    function createWidget() {
        var existing = document.querySelector('[data-opus-widget]');
        if (existing) existing.remove();

        var container = document.createElement('div');
        container.setAttribute('data-opus-widget', 'true');
        container.setAttribute('data-widget-type', WIDGET_TYPE);
        //container.style.cssText = 'margin: 20px 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';

        var iframe = document.createElement('iframe');
        iframe.id = 'opus-widget-iframe-' + Date.now();
        iframe.src = IFRAME_SRC;
        iframe.title = WIDGET_TYPE === 'payment_methods' ? 'Payment Methods' : 'HSA/FSA Savings Calculator';
        iframe.style.cssText = 'width: 100%; height: 200px; border: none; transition: height 0.3s ease-in-out; display: block;';
        iframe.scrolling = 'no';
        iframe.frameBorder = '0';

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
