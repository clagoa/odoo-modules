# web_one2many_ng
Advanced actions on One2Many fields
Adding the 'one2many_ng' widget to a One2many field you can define fields to create/delete records in bulk or python arbitrary actions on selected records.

## How it works?
You must indicate that the One2Many field should use the 'one2many_ng' widget
```html
<field name="categoria_producto_rel_ids" widget="one2many_ng" />
```
'Actions' attribute should be added to the xml field element to define bulk actions. Each action you can be defined with the following properties:
- **name**: Name of python method related field model to run one2many
- **multiselect**: If set to "1", the python method will receive the list of selected records (one2many field). You must select some values before run the action.
- **string**: Tag Action
- **separator**: If set to "1" separator is added after the action.

```html
<field name="categoria_producto_rel_ids" 
       widget="one2many_ng"
       actions='[
          {	
            "name": "bulk_action3", 
            "string": "Accion 3",
            "multiselect": "1"
          },
          {
            "name": "bulk_action4", 
            "string": "Accion 4",
            "multiselect": "1"
          }
       ]'>
```

If you want to add actions to create or delete massively you should add the attributes mass_add_field or mass_del_field in the Many2one fields where the action is desired.
```html
<field name="categoria_producto_rel_ids" widget="one2many_ng">
	  <tree editable="Botton">
		    <field name="producto_id" 
						   mass_add_field="1"
						   mass_del_field="1" />
				<field name="producto2_id" 
						   mass_add_field="1" />
				<field name="producto3_id" 
						   mass_add_field="1" />
				<field name="nombre_relacion" />
				<field name="fecha" />
    </tree>
</field>
```

##Python function example
```python
@api.multi
def bulk_action3(self):
    print 'bulk_action3'
    for record in self:
        print record
    return True
```

A python method can returns an act_window to be executed after server call.
```python
@api.multi
    def mass_edit_selected(self):     
        mod_ref = "{0}.model_{1}".format(self._module, self._name)
        mod = self.env.ref(mod_ref)
        mass_obj = self.env['mass.object'].search([('model_id', '=', mod.id)])        
          
        ctxt = eval(mass_obj.ref_ir_act_window_id.context)
        ctxt['active_model'] = self._name
        ctxt['active_ids'] = [rec.id for rec in self]

        return {
            'type': mass_obj.ref_ir_act_window_id.type,
            'res_model': mass_obj.ref_ir_act_window_id.res_model,
            'view_mode': mass_obj.ref_ir_act_window_id.view_mode,
            'view_type': mass_obj.ref_ir_act_window_id.view_type,
            'views': mass_obj.ref_ir_act_window_id.views,
            'view_id': mass_obj.ref_ir_act_window_id.view_id.id,  
            'context': ctxt,            
            'target': mass_obj.ref_ir_act_window_id.target,
            'auto_refresh': mass_obj.ref_ir_act_window_id.auto_refresh,
            'auto_search': mass_obj.ref_ir_act_window_id.auto_search
        }
```
