'use strict';

/*
 * filterBy=field1:value1,field2:value2,...
 */
exports.filter = function(q, req) {
    if (req.query.filterBy) {
        // var filters = req.query.filterBy.split(',').map(function(keyValue) {
        //     keyValue = keyValue.split(':');
        //     var o = {};
        //     o[keyValue[0]] = keyValue[1];
        //     return o;
        // });
        var filters = JSON.parse(req.query.filterBy);
        Object.keys(filters).forEach(function(key) {
            if (typeof filters[key] === 'string') {
                filters[key] = new RegExp(filters[key], 'gi');
            }
        });
        console.log(req.query.filterBy, filters);
        q.and(filters);
    }
};

/*
 * sortBy=field1:1,field2:-1,...
 */
exports.sort = function(q, req, defaultSort) {
    var sorts;
    if (req.query.sortBy) {
        // var sorts = {};
        // req.query.sortBy.split(',').map(function(keyValue) {
        //     keyValue = keyValue.split(':');
        //     sorts[keyValue[0]] = +keyValue[1] || 1;
        // });
        sorts = JSON.parse(req.query.sortBy);
    } else {
        sorts = defaultSort;
    }
    // console.log(req.query.sortBy, sorts);
    q.sort(sorts);
};

/*
 * count=20
 * page=0
 **/
exports.paginate = function(q, req, count) {
    if (!count)
        count = 20;
    if (req.query.count) {
        count = parseInt(req.query.count, 10) || count;
    }
    q.limit(count);

    if (req.query.page) {
        var offset = (parseInt(req.query.page, 10) || 0) * count;
        q.skip(offset);
    }
};
