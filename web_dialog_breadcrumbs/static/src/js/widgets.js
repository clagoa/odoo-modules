odoo.define('web_dialog_breadcrumbs.Dialog', function(require) {
"use strict";

var Dialog = require('web.Dialog');

Dialog.include({
    /*
     * Constructor. We overwrite it to append breadcrumbs to the dialog title.
     */
    init: function (parent, options) {
        var bcs = _.pluck($('ol.oe-view-title.breadcrumb > li'), 'outerText');
        if (bcs) {
            var prev_title = '';
            if (options.title) {
                prev_title = ' / ' + options.title;
            }
            options.title = bcs.join(' / ') + prev_title;
        }

        this._super(parent, options);
    },
});

return Dialog;
});
