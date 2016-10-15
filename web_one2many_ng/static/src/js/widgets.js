odoo.define('web_one2many_ng.form_widgets', function(require) {
"use strict";
var core = require('web.core');
var Model = require('web.Model');
var _t = core._t;
var QWeb = core.qweb;
var FieldOne2Many = core.form_widget_registry.get('one2many');
var common = require('web.form_common');
var data = require('web.data');

var One2ManyNg = FieldOne2Many.extend({
	multi_selection : false,

	/* 
	 * Inicializa el control.
	 * Se sobreescribe el constructor padre para que procese el atributo
	 * actions, a través del cual, se le pasará el listado de acciones a 
	 * incluir en el menubuton.
	 * 
	 * @param	field_manager	obj
	 * @param	node			obj
	 * */
	init : function(field_manager, node) {		
		this._super.apply(this, arguments);		
									
		this.id = _.uniqueId('one2manyng_');
		this.init_actions(node);	
	},		
	
	/* Procesa el parámetro del widget actions para poder renderilzarlo como
	 * acciones del menubutton del control o2m de tipo lista.
	 * 
	 * El atributo actions será un listado de elementos con las siguientes
	 * propiedades:
	 * 		name: nombre del método del modelo a llamar
	 * 		string: etiqueta a mostrar en el boton
	 * 		separator: (bool) si debe añadir un separador despues de la accion 
	 * 
	 * @param	node	obj	Nodo del widget o2m
	 */
	init_actions: function(node) {
		var self = this;
		self.actions = [];
		if (node && node.attrs && node.attrs.actions) {
			self.actions = JSON.parse(node.attrs.actions);				
			_.each(self.actions, function(action) {
				action.id = _.uniqueId('one2manyng_button_');
			});						
		}
	},
	
	/* Se sobreescribe el método para suscribirnos al cambio de modo de la
	 * vista, para poder controlar cuando se pone en modo editable.		 
	 */
	start : function() {
		this._super.apply(this, arguments);					
		
		var self = this;
		self.field_manager.on("change:actual_mode", self, self.check_actual_mode);
        self.check_actual_mode();
        
        self.view_list = self.get_list_view(self.views);
        
        // mass add        
		var mass_add_fields = self.get_mass_add_fields(self.view_list);
		var add_actions = [];
		_.each(mass_add_fields, function(field){
			add_actions.push({
				'id': _.uniqueId('one2manyng_add_many_'),
				'multiselect': 0,
				'local': 1,
				'name': 'do_add_many_records',
				'string': _t('Add ') + field.string.toLowerCase() + '(s)',
				'mass_add_field': field
			});
		});	
		if(!_.isEmpty(add_actions)) {
			add_actions[add_actions.length-1].separator = true;	
		}		
		
		// mass del        
		var mass_del_fields = self.get_mass_del_fields(self.view_list);
		var del_actions = [];
		_.each(mass_del_fields, function(field){
			del_actions.push({
				'id': _.uniqueId('one2manyng_del_many_'),
				'multiselect': 0,
				'local': 1,
				'name': 'do_del_many_records',
				'string': _t('Del ') + field.string.toLowerCase() + '(s)',
				'mass_del_field': field
			});
		});	
		if(!_.isEmpty(del_actions)){
			del_actions[del_actions.length-1].separator = true;	
		}		
		
		self.actions = _.union(add_actions, del_actions, self.actions);		
	},				
		
	/* Función suscriptora del cambio de modo. Cambia el modo de lista a
	 * seleccionable o no en función de si el formulario esta editable o no
	 * 
	 * @param	source	obj	
	 * @param	options	obj
	 * */
	check_actual_mode: function(source, options) {
	    var self = this;
	    
	    if(self.field_manager.get("actual_mode") == 'edit' 
	    		|| self.field_manager.get("actual_mode") == 'create') 
	    {
	    	self.multi_selection = true;
	    	self.views[0].options.selectable = true;
	    }
	    else {
	    	self.multi_selection = false;
	    	self.views[0].options.selectable = false;
	    }
	},
	
	/* 
	 * Se sobreescribe el método para poder añadir el menubuton con las 
	 * acciones al poner la vista en modo editable
	 * */
	reload_current_view: function() {
		var self = this;					
		
		if (this.view.get('actual_mode') == 'edit'
    			|| this.view.get("actual_mode") == 'create') 
		{				
			var $th_actions = this.$el.find('th.oe_list_record_delete').first();
			var actions_exists = $th_actions.find('#' + self.id).length > 0;
			if(!actions_exists && $th_actions && $th_actions.length == 1) {				
				self.$button_el = $('<div id="' + self.id + '">');
				self.$button_el.append(QWeb.render("One2ManyNG", {
					widget : this
				}));
				
				_.each(self.actions, function(action){
					self.$button_el.find("#" + action.id).click(function(e) {
						e.preventDefault();
	                    e.stopPropagation();
	                    self.action_selected_lines(action);
					});
				});	
				
				$th_actions.append(self.$button_el);
			}
		}			
					
		return this._super.apply(this, arguments);			
	},
	
	/*
	 * Acción genérica que se ejecuta al pulsar una acción del menubuttom
	 * 
	 * @param	action	obj	Acción a ejecutar	
	 */
	action_selected_lines : function(action) {
		var self = this;
		var selected_ids = null;
		
		selected_ids = self.get_selected_ids_one2many();
		
		if (action.multiselect) {			
			if (selected_ids.length === 0) {
				this.do_warn(_t("You must choose at least one record."));
				return false;
			}
		}
		
		/// Acciones locales (métodos js sobre del widget)
		if(action.local){
			self[action.name](action, selected_ids).done(function(){
				self.reload_current_view();
			});				
			
		/// Acciones de servidor (métodos python del modelo)
		} else {			
			/// Existen cambios sin guardar?
			if(self._dirty_flag) { 
				if (confirm(_t('Changes will be saved. Do you want to continue?'))) {
					self.save_and_reload_keeping_selected().done(function(selected_ids){
						self.do_server_action_selected(action, selected_ids).done(function(){
							if (action.reload === '1') {														
								self.view.reload();				
							}
						});
					});	
				}
			}else{
				self.do_server_action_selected(action, selected_ids).done(function(){
					if (action.reload === '1') {														
						self.view.reload();				
					}
				});
			}											
		}				
	},
	
	/*
	 * Ejecuta una acción de servidor sobre los registros seleccionados
	 * 
	 * @param	selected_ids(Array(int))	Id's de los registros sobre los
	 * 										que realizar los cambios
	 */
	do_server_action_selected: function(action, selected_ids) {
		var self = this;
		var defer = $.Deferred();
		
		var model_obj = new Model(self.dataset.model); 										
		model_obj.call(action.name, [ selected_ids ], {
			context : self.dataset.context
		}).then(function(result) {						
			if (result && (result.type == "ir.actions.act_window")) {	
				self.do_action_window(result).done(function() {
					defer.resolve();
				});
			} else {
				defer.resolve();						
			}				
		});
		
		return defer.promise();
	},
	
	/*
	 * Guarda los cambios y mantiene los registros seleccionados. La selección 
	 * se puede haber hecho sobre registros que todavía no se habían insertado
	 * por lo que es necesario conservar los indices seleccionados en el dataset,
	 * guardar los cambios y volver a recuperar el id ya generado a partir de 
	 * los indices anteriormente guardados.
	 * 
	 * @returns	(promise)
	 */
	save_and_reload_keeping_selected: function(){
		var self = this;
		var defer = $.Deferred();
		
		var selected_idxs = self.get_dataset_idxs_from_ids(self.get_selected_ids_one2many_str());						
		self.view.save().done(function() {	
			self.view.reload().done(function(){	
				var selected_ids = self.get_dataset_ids_from_idxs(selected_idxs);
				defer.resolve(selected_ids);
			});
		});
		
		return defer.promise();		
	},
	
	/*
	 * Devuelve los indices dentro del objeto dataset a partir de los ids 
	 * que se le pasan por parámetro.
	 * 
	 * @param	ids(Array(str))	
	 * 
	 * @returns	(Array(int))
	 */
	get_dataset_idxs_from_ids: function(ids) {		
		var self = this;
		var idxs = [];	
		
		_.each(ids, function(id){
			var idx = self.dataset.ids.indexOf(id);
			if(idx === -1) {
				idx = self.dataset.ids.indexOf(parseInt(id));
			}
			idxs.push(idx);
		});
		
		return idxs;
	},
	
	/*
	 * Devuelve los id's de los registros dentro del dataset a partir de los
	 * indices que se le pasan por parámetro
	 * 
	 * @param	idxs(Array(int))	
	 * 
	 * @returns	(Array(int))
	 */
	get_dataset_ids_from_idxs: function(idxs) {
		var self = this;
		var ids = [];

		_.each(idxs, function(idx){
			ids.push(self.dataset.ids[idx]);
		});
		
		return ids;
	},
	
	/*
	 * Ejecuta una acción de tipo act window 
	 * 
	 * @param	act_window(ir.actions.act_window)	Action window a ejecutar
	 * 
	 * @returns (promise)
	 */
	do_action_window: function(act_window) {
		var self = this;		
		
		if (act_window.type != "ir.actions.act_window") {
			throw _t('The action should be an action window.');
		}
								
		act_window = self.fix_act_window_result(act_window);
		
		var defer = $.Deferred();
		self.do_action(act_window, {
			on_close: function(result) {
				defer.resolve(result);
			}
		});
		
		return defer.promise();
	},
	
	/*
	 * Se corrige el resultado de tipo act_window, ya que al serializarlo en 
	 * Json desde la capa de servidor introduce unos espacios que es necesario
	 * eliminar
	 * 
	 * @param	result	obj(act_window)	
	 * 
	 * @returns			obj(act_window)
	 */
	fix_act_window_result: function(result) {
		if (result.type == "ir.actions.act_window") {
			result.view_mode = result.view_mode.replace(' ', '');
			_.each(result.views, function(view){
				view[1] = view[1].replace(' ', ''); 
			});
		}
		
		return result;
	},
	
	/*
	 * Devuelve los registros seleccionados en el control o2m
	 * 
	 * @returns		array(int)	Lista de ids seleccionados en el control o2m
	 */
	get_selected_ids_one2many: function() {
		var ids = [];
		this.$el.find('th.oe_list_record_selector input:checked').closest(
				'tr').each(function() {
			ids.push(parseInt($(this).context.dataset.id));
		});
		return ids;
	},
	
	/*
	 * Devuelve los registros seleccionados en el control o2m
	 * 
	 * @returns		array(str)	Lista de ids seleccionados en el control o2m
	 */
	get_selected_ids_one2many_str: function() {
		var ids = [];
		this.$el.find('th.oe_list_record_selector input:checked').closest(
				'tr').each(function() {
			ids.push($(this).context.dataset.id);
		});
		return ids;
	},
		
	/*
	 * Ejecuta la acción de añadir de forma masiva
	 * 
	 * @param	action	obj		Acción de añadir a ejecutar
	 */
	do_add_many_records: function(action) {
		var self = this;  
		var defer = $.Deferred(); 

		if (!action || !action.mass_add_field) {
			throw _t('You should setup a many2one mass_add_field.');
		}
                              
        var field_selected_ids = self.get_selected_field_ids_from_cache(action.mass_add_field.name);
        new common.SelectCreateDialog(this, {
            res_model: action.mass_add_field.relation,
            domain: new data.CompoundDomain(action.mass_add_field.domain, 
            								["!", ["id", "in", field_selected_ids]]),
            context: {},
            title: _t("Add: ") + action.mass_add_field.string + '(s)',
            alternative_form_view: action.mass_add_field.views ? action.mass_add_field.views.form 
            										    	   : undefined,
            no_create: self.options.no_create,
            on_selected: function(element_ids) {   
            	var defer_list = [];
            	_.each(element_ids, function(id){
            		var data = {};		
            		data[action.mass_add_field.name] = id;            		
            		defer_list.push(self.data_create(data));
            	});   
            	$.when.apply($, defer_list).done(function(){
            		defer.resolve();
            	});
            }
        }).open();
                
        return defer.promise();
	},
	
	/*
	 * Ejecuta la acción de eliminar de forma masiva
	 * 
	 * @param	action	obj		Acción de eliminar a ejecutar
	 */
	do_del_many_records: function(action, selected_ids) {
		var self = this;
		var defer = $.Deferred();

		if (!action || !action.mass_del_field) {
			throw _t('You should setup a many2one mass_del_field.');
		}
        
		/// Si ya se han seleccionado registros para eliminar, se eliminan
		if (selected_ids && !_.isEmpty(selected_ids)) {
			if (confirm(_t('Are you sure you want to delete selected rows?'))) {
				var defer_list = [];
				_.each(selected_ids, function(del_id){
					defer_list.push(self.data_delete(del_id));
        		});
				$.when.apply($, defer_list).done(function(){
            		defer.resolve();
            	});
			}
			
		/// Si no se han seleccionado registros se abre el formulario para 
		/// seleccionar los registros que se quieren eliminar.
		} else {  
			var field_selected_ids = self.get_selected_field_ids_from_cache(action.mass_del_field.name);
	        new common.SelectCreateDialog(this, {
	            res_model: action.mass_del_field.relation,
	            domain: new data.CompoundDomain(action.mass_del_field.domain, 
	            								[["id", "in", field_selected_ids]]),
	            context: {},
	            title: _t("Delete: ") + action.mass_del_field.string + '(s)',
	            alternative_form_view: action.mass_del_field.views ? action.mass_del_field.views.form 
	            										    	   : undefined,
	            no_create: true,
	            on_selected: function(element_ids) {  
	            	if (confirm(_t('Are you sure you want to delete selected rows?.'))) {
	            		var defer_list = [];
		            	_.each(element_ids, function(ele_id){
		            		var del_ids = self.get_selected_ids_by_field_id_from_cache(action.mass_del_field.name, ele_id);
		            		_.each(del_ids, function(del_id){
		            			defer_list.push(self.data_delete(del_id));		            			
		            		});            		
		            	});
		            	$.when.apply($, defer_list).done(function(){
		            		defer.resolve();
		            	});
	            	}
	            }
	        }).open();
		}		
		
		return defer.promise();
	},
	
	/*
	 * Devuelve los id's del campo m2o que ya existen en los reigstros del campo
	 * o2m.
	 * 
	 * @param	field_name	str			Nombre del campo m2o
	 * 
	 * @returns				array(int)	Lista de ids del campo seleccionados
	 */
	get_selected_field_ids_from_cache: function(field_name){
		var self = this;
		var ids = [];
				
		_.each(self.dataset.cache, function(rec){
			var changes = _.extend(rec.from_read, rec.changes);
			if(changes && changes[field_name] && !rec.to_delete)
			{
				var add_id = _.isArray(changes[field_name]) ? changes[field_name][0]
				 											: changes[field_name];
				ids.push(add_id);				
			}
		});
		
		return ids;
	},
	
	/*
	 * Devuelve el id de registro o2m dado el id del registro del campo m2o
	 * 
	 * @param	field_name	str		Nombre del campo m2o
	 * @param	field_id	int		Id del campo m2o
	 * 
	 * @returns				array(int)	Lista de ids del campo o2m
	 */
	get_selected_ids_by_field_id_from_cache: function(field_name, field_id){
		var self = this;
		var ids = [];
				
		_.each(self.dataset.cache, function(rec){
			var changes = _.extend(rec.from_read, rec.changes);
			if(changes && changes[field_name] && !rec.to_delete)
			{
				var del_id = _.isArray(changes[field_name]) ? changes[field_name][0]
				 											: changes[field_name];				
				if (del_id === field_id) {
					ids.push(rec.id);						
				}								
			}
		});
		
		return ids;
	},
	
	/*
	 * Devuelve los campos que se han marcado como campos de adición masiva
	 * 
	 * @param	view_list	obj			Objeto vista tipo lista (del control o2m)
	 * 
	 * @returns				array(obj)	Lista de objetos field
	 */
	get_mass_add_fields: function(view_list) {
		var mass_add_fields = [];
			
		if (view_list.embedded_view.arch 
				&& view_list.embedded_view.arch.children) 
		{
			_.each(view_list.embedded_view.arch.children, function(node){	
				if (node.attrs && node.attrs.mass_add_field 
						&& (node.attrs.mass_add_field === '1')) 
				{
					var mass_add_field = view_list.embedded_view.fields[node.attrs.name];
			        if (!mass_add_field || (mass_add_field.type != 'many2one')) {
			        	throw _t('The field %s should be many2one field.') % node.attrs.name;
			        }			 
			        mass_add_field.name = node.attrs.name;
					mass_add_fields.push(mass_add_field);
				}
			});
		}		
		
		return mass_add_fields;
	},
	
	/*
	 * Devuelve los campos que se han marcado como campos de eliminación masiva
	 * 
	 * @param	view_list	obj			Objeto vista tipo lista (del control o2m)
	 * 
	 * @returns				array(obj)	Lista de objetos field
	 */
	get_mass_del_fields: function(view_list) {
		var mass_del_fields = [];
			
		if (view_list.embedded_view.arch 
				&& view_list.embedded_view.arch.children) 
		{
			_.each(view_list.embedded_view.arch.children, function(node){	
				if (node.attrs && node.attrs.mass_del_field 
						&& (node.attrs.mass_del_field === '1')) 
				{
					var mass_del_field = view_list.embedded_view.fields[node.attrs.name];
			        if (!mass_del_field || (mass_del_field.type != 'many2one')) {
			        	throw _t('The field %s should be many2one field.') % node.attrs.name;
			        }			 
			        mass_del_field.name = node.attrs.name;
					mass_del_fields.push(mass_del_field);
				}
			});
		}		
		
		return mass_del_fields;
	},
	
	/*
	 * Devuelve la vista tipo lista dado el array de vistas asociados al control
	 * o2m
	 * 
	 * @param	views	array(obj)	Lista de objetos vista asociados al o2m
	 * 
	 * @returns			obj			Objeto ListView
	 */
	get_list_view: function(views){		
		var view_list = _.find(views, function(item){
        	return item.view_type === 'list';
        });
		
		if (!view_list || !view_list.embedded_view) {
			throw _t('Can not find list view.');
		}
		
		return view_list;
	},
	
});
core.form_widget_registry.add('one2many_ng', One2ManyNg);	

return One2ManyNg;
});
