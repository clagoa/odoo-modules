odoo.define('web.web_float_max_precision_input_lock', function (require) {
"use strict";  

var core = require('web.core');
var _t = core._t;
var FieldFloat = require('web.form_widgets').FieldFloat;

FieldFloat.include({
    render_value: function() {    	
        var self = this;
        this._super();
        if (!this.get('readonly')){
            this.$el.find('input').on('keypress', 
            	this.float_max_precision_input_lock.bind(this)
            );
        }
    },
    
    float_max_precision_input_lock: function(e){    	
    	var self = this;
  
    	if (self.field && self.field.digits && self.field.digits[1]){
    		var allowed_decimals = self.field.digits[1];
    		var prev_val = this.$el.find('input').val();
        	var new_val = prev_val + (e.charCode !== 0 ? String.fromCharCode(e.charCode) : '');    		
    		var num_str = new_val.replace(_t.database.parameters.decimal_point, '.');
    		var decimal_places = self.get_decimal_places(num_str);
    		if (decimal_places > allowed_decimals) {
    			e.preventDefault();
    		}
    	}    	
    },
    
    get_decimal_places: function(num) {
    	var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    	if (!match) { return 0; }
    	return Math.max(
	       0,  
	       (match[1] ? match[1].length : 0) // Number of digits right of decimal point.	       
	       	- (match[2] ? +match[2] : 0));// Adjust for scientific notation.
	}
});

return FieldFloat
});