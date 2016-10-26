odoo.define('web.web_float_nullable', function (require) {
"use strict";  

var core = require('web.core');
var _t = core._t;
var FieldFloat = require('web.form_widgets').FieldFloat;
var Column = core.list_widget_registry.get('field');

var FieldFloatNullable = FieldFloat.extend({
	/*
	 * Before call parent method we check if the value that the user had input
	 * was a blank value. If it was, we set the related is_null field to true.
	 */
	store_dom_value: function() {
		var data = {};
		data[this.name + '_is_null'] = (this.$('input').val() === '');
		this.view.set_values(data);

		this._super.apply(this, arguments);
	},

	/*
	 * After call parent method we test if is a null value. If it is, the value
	 * is formated as blank value.
	 */
	format_value: function(val, def) {
		var formatted_value = this._super.apply(this, arguments);

		if (this.value_is_null() && (parseInt(formatted_value) === 0)) {
			formatted_value = '';
		}

		return formatted_value;
	},

	/*
	 * Returns if a value is null or not.
	 */
	value_is_null: function(){
		var is_null = false;

		if (this.name + '_is_null' in this.field_manager.datarecord) {
			is_null = this.field_manager.datarecord[this.name + '_is_null'];
		}else{
			this.do_warn(_t("You must include the following fields in the view: ")
							+ this.name + '_is_null');
		}

		return is_null;
	}
});

Column.include({
    /*
     * It controls if the column is defined to use the widget 'float_nullable',
     * to format as blank when the value is set to null
     */
	format: function (row_data, options) {
		var formatted_value;

		if ((this.widget == 'float_nullable') && this.value_is_null(row_data)) {
			formatted_value = '';
		} else {
			formatted_value = this._super.apply(this, arguments);
		}

		return formatted_value;
	},

	/*
	 * Returns if a value is null or not.
	 */
	value_is_null: function(row_data){
		var is_null = false;

		if (this.id + '_is_null' in row_data) {
			is_null = row_data[this.name + '_is_null'].value;
		} else {
			this.do_warn(_t("You must include the following fields in the view: ")
							+ this.id + '_is_null');
		}

		return is_null;
	}
});

core.form_widget_registry.add('float_nullable', FieldFloatNullable);

return {
	'FieldFloatNullable': FieldFloatNullable,
	'Column': Column
}

});