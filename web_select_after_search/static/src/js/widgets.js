odoo.define('web_select_after_search.SelectCreateDialog', function(require) {
"use strict";

var common = require('web.form_common');
var pyeval = require('web.pyeval');

common.SelectCreateDialog.include({
    /*
     * We override the do_search method to check (select) every record resulting
     * after a search on a SelectCreateDialog. We do not call super() method because
     * we need to do our stuff after the search returns, then we need to use
     * the Deferred that view_list.do_search returns, and the super() method do
     * not returns.
     */
    do_search: function(domains, contexts, groupbys) {
        var self = this;

        var results = pyeval.sync_eval_domains_and_contexts({
            domains: domains || [],
            contexts: contexts || [],
            group_by_seq: groupbys || []
        });

        this.view_list.do_search(results.domain, results.context, results.group_by).done(function(){
            var after_search = self.domain.eval().length != results.domain.length;
            if (self.view_list && after_search) {
                var $chkbx_th = self.view_list.$el.find('table > thead > tr.oe_list_header_columns > th:nth-child(1) > input').first();
                $chkbx_th.click();
            }
        });        
    },
});

return common.SelectCreateDialog;

});
