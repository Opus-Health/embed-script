(function() {
    // Prevent multiple executions
    if (window.hsaCalculatorLoaded) {
        console.log('HSA Calculator already loaded');
        return;
    }
    window.hsaCalculatorLoaded = true;

    // Detect environment from script tag src (e.g., @main, @dev)
    function detectEnvironment() {
        var scripts = document.querySelectorAll('script[src*="cdn.jsdelivr.net"]');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].getAttribute('src');
            var match = src.match(/@([\w.-]+)\//); // matches @main/, @dev/, @v1.0.0/, etc.
            if (match && match[1]) {
                return match[1];
            }
        }
        return 'main'; // default to prod
    }

    var BRANCH = detectEnvironment();

    // Map branch → iframe URL
    var ENV_URL_MAP = {
        main: 'https://calculator.opushealth.io',
        dev: 'https://calculator.opushealth.io',
        local: 'http://localhost:5173'
    };

    var IFRAME_SRC = 'http://localhost:5173';
    console.log('IFRAME_SRC', IFRAME_SRC);
    var IFRAME_ID = 'hsa-calculator-iframe-' + Date.now();

    function createCalculator() {
        var existing = document.querySelector('[data-hsa-calculator]');
        if (existing) existing.remove();

        var container = document.createElement('div');
        container.setAttribute('data-hsa-calculator', 'true');
        container.style.cssText = 'margin: 20px 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';

        var iframe = document.createElement('iframe');
        iframe.id = IFRAME_ID;
        iframe.src = IFRAME_SRC;
        iframe.title = 'HSA/FSA Savings Calculator';
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
            const allowedOrigins = Object.values(ENV_URL_MAP);
            if (
                allowedOrigins.includes(event.origin) &&
                event.data?.type === 'RESIZE_IFRAME' &&
                event.data?.source === 'hsa-calculator' &&
                typeof event.data.height === 'number'
            ) {
                iframe.style.height = event.data.height + 'px';
                console.log('HSA Calculator resized to:', event.data.height + 'px');
            }
        }
        window.addEventListener('message', handleResize, false);
        console.log(`HSA Calculator loaded from [${BRANCH}] → ${IFRAME_SRC}`);
    }

    function init() {
        var iframe = createCalculator();
        setupResizeHandler(iframe);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
