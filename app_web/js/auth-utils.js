// auth_utils.js - SOLO UTILIDADES (NO AUTH)
(function(){
    function sanitizeInput(value) {
        if (typeof value !== 'string') return '';
        return value.replace(/[-\u001F\u007F-\u009F]/g, '').trim();
    }

    function validateEmail(email) {
        const e = sanitizeInput(String(email || '')).toLowerCase();
        const re = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;
        return re.test(e);
    }

    window.serenityUtils = Object.freeze({
        sanitizeInput,
        validateEmail
    });
})();