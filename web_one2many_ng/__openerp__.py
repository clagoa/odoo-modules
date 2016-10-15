# -*- coding: utf-8 -*-
##############################################################################
#
#    OpenERP, Open Source Management Solution
#    This module copyright (C) 2016 Shawn
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################
{
    "name": "One2ManyNG",
    "version": "9.0",
    "author": "Claudio Lagoa Vieitez <clagoa@gmail.com>",
    "license": "AGPL-3",
    "summary": "Widget One2Many con funcionalidades avanzadas para crear y definir acciones que se ejecutan de forma masiva",
    "description": '''
Descripión
-----------
Este widget añade la posibilidad de selección multiples registros en un campo
one2many y llamar a funciones definidas en python en el modelo al que hace referencia
el campo one2many.

Añade un menubuttom en la derecha de la cabecera de la tabla de ListView con una
opción por cada una de las acciones definidas en el atributo actions de la 
definición xml de la view.

Añade además la posibilidad de insertar registros sobre el campo o2m de forma
masiva, seleccionando sobre uno de los campos de la tabla o2m. Este campo deberá
ser de tipo m2o y se le indicará al widget a través del atributo default_create_field

e.g. <field name="course_id" widget="x2many_selectable"
            actions='[
               {"name": "bulk_action1", "string": "Acción 1"},
               {"name": "bulk_action2", "string": "Acción 2", "separator": "1"},
               {"name": "bulk_action3", "string": "Acción 3"},
               {"name": "bulk_action4", "string": "Acción 4"}
             ]'             
             default_create_field='producto_id' />
        <tree>
            <field name="title" />
        </tree>
    </field>

You can get the selected records in python function, a smple python function is as follows:

@api.multi
def bulk_action1(self):
    print 'bulk_action1'
    for record in self:
        print record

@api.multi
def bulk_action2(self):
    print 'bulk_action2'
    for record in self:
        print record

@api.multi
def bulk_action3(self):
    print 'bulk_action3'
    for record in self:
        print record
        
@api.multi
def bulk_action4(self):
    print 'bulk_action4'
    for record in self:
        print record

Acknowledgements
----------------
This plugin is inspired from its oddo 8 equivalent https://github.com/goose1/web_one2many_selectable
Icon courtesy of http://www.iconfinder.com/
    ''',    
    "category": "Web Enhancements",
    "depends": [
        'web',
    ],
    "data": [
        "view/web_assets.xml",
    ],
    "qweb":[
        'static/src/xml/widget_view.xml',
    ],
    "auto_install": False,
    "installable": True,
    "application": False,
    "external_dependencies": {
        'python': [],
    },
}
