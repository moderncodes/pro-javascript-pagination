(function(root,factory){
    if(typeof define === 'function'){
        define(factory);
    } else if(typeof exports === 'object'){
        module.exports = factory();
    } else {
        root.Pagination = factory();
    }
}(this,function(){
    /**
     * @function
     * @param {Object} o
     * @param {Object} o.trgt       "ul" element target
     * @param {number} [o.range=4]  total pages display from both sides. If less pages on either side, will add remaining to the opposite
     * @param {function} [o.onChange] will attach callback event on change event to the module object
     * @param {boolean} [o.disabled=false] disables or enables module. Helpful from spam clicking. Used for ajax.
     * @param {Object} [o.state]    load settings
     * @param {number} [o.state.pg=1] page active
     * @param {number} [o.state.per=25] display per page
     * @param {number} [o.state.total=1] total pages
     * */
    function Pagination(o) {
        let _self = this;

        _self.disabled = false;
        _self.range = 4;
        _self.state = {pg:1,per:25,total:1};
        if(!(_self instanceof Pagination)){throw new TypeError("Pagination constructor cannot be called as function");}

        // pass vars in to the object
        for(let key in o){
            if(!o.hasOwnProperty(key)) continue;
            _self[key] = o[key];
        }

        _self._init();
    }

    /**
     * @function template
     * @param {Object[]}        arr
     * @param {boolean}         [arr[].disabled=false] - Disable li element. On li click will be disabled
     * @param {string|number}   arr[].value - li type. +/- as string, page always numeric
     * @param {boolean}         [arr[].active=false] - Active li element
     * @param {array}           [arr[].class=[]] - optional class list
     * @param {number}          [range=5]    - page range
     * @returns {string}
     * */
    function template(arr, range){
        let i,t,tmp,cls,
            rng = range ||  5,
            l=arr.length,
            template = '<li {{class}}>{{value}}</li>',
            findActv = arr.find(function(indx){
                return indx.hasOwnProperty('active') && indx.active;
            }),
            actv = findActv ? findActv.value : 1,
            html="";

        for(i=0;i<l;i++){

            tmp = template;

            // class array
            cls = arr[i].hasOwnProperty('class') ? arr[i].class : [];

            // page value
            t = arr[i].value;
            if(typeof t === "number"){
                if(!nearInt(t, actv, rng,l-2)) continue;

            } else if(typeof t === "string"){
                if(t === '-'){
                    t = '&#10094;';
                } else if(t === '+'){
                    t = '&#10095;';
                }
            }

            // active
            if(arr[i].hasOwnProperty('active') && arr[i].active){cls.push("active");}
            // disabled
            if(arr[i].hasOwnProperty('disabled') && arr[i].disabled){cls.push("disabled");}

            cls = cls.length ? 'class="' + cls.join(" ") + '"' : "";
            tmp = tmp.replace('{{value}}',t).replace('{{class}}',cls);
            html +=tmp;
        }

        return html;
    }

    /**
     * @function nearInt
     * @param {number} pg       current page
     * @param {number} active   page active
     * @param {number} range    range
     * @param {top} top         highest page
     * @returns {boolean}
     * */
    function nearInt(pg, active, range, top){
        let x = active-range-1 < 1 ? active-range-1 : 0,
            y = active+range > top ? top-active-range : 0;

        return pg <= (active + range -x) && pg >= active - range +y;
    }


    Pagination.prototype = {
        constructor: Pagination,
        /**
         * @method _init
         * */
        _init    : function(){
            let _self = this;
            _self.update(_self.state);
            _self.trgt.addEventListener('click',function(e){
                if(_self.trgt.classList.contains('disabled')) return false;
                let r = {},ofst,x,y,
                    len = _self.data.length,
                    trgt = e.target.closest('li'),
                    ulElArr = [].slice.call(_self.trgt.children),
                    indx = ulElArr.indexOf(trgt),
                    actv = _self.data.find(function(indx){return indx.hasOwnProperty('active') && indx.active;}),
                    calcRng = [1,_self.range*2+1];

                r.o = actv.value || 1;

                if(actv){
                    ofst = r.o + _self.range >= len-2 ? len-2 - (r.o + _self.range) : 0;
                    x = r.o - _self.range + ofst;
                    y = x <= 1 ? 1 : x;
                    calcRng[0] = y;

                    ofst = r.o - _self.range < 1 ? Math.abs(r.o - _self.range)+1 : 0;
                    x = r.o + _self.range + ofst;
                    y = x >= len-2 ? len-2 : x;
                    calcRng[1] = y;
                }


                if(indx+1 === ulElArr.length){ // INCREASE
                    r.n = r.o+1 < len-2 ? r.o+1 : len-2;
                } else if(indx === 0){ // DECREASE
                    r.n = r.o-1 > 1 ? r.o-1 : 1;
                } else { // ACTUAL PAGE CLICKED
                    r.n = indx + calcRng[0]-1;
                }

                _self.onNewState({
                    pg:r.n
                });

            },false);
        },

        /**
         * @method onNewState
         * @param {Object} o
         * @param {Number} [o.pg]     current page number
         * @param {Number} [o.per]    total per page
         * @param {Number} [o.total]  database total count
         * */
        onNewState  : function(o){
            let _self = this,key;
            if(typeof o !== "undefined"){
                for(key in _self.state){
                    if(!_self.state.hasOwnProperty(key)) continue;
                    if(o.hasOwnProperty(key)){_self.state[key] = o[key]}
                }
            }
            _self.update(_self.state);

            if(_self.hasOwnProperty('onChange') && typeof _self.onChange === 'function'){
                _self.onChange(_self.state);
            }

        },
        /**
         * @method update
         * @param {Object} o
         * @param {Number} o.pg     current page number
         * @param {Number} o.per    total per page
         * @param {Number} o.total  database total count
         * */
        update  : function(o){
            let _self = this,i,tmp,
                pagestotal = Math.ceil(o.total/o.per),
                html = "";

            _self.state = o;

            // first: decrease page button
            tmp = {value:'-'};
            if(pagestotal === 1 || o.pg === 1){tmp.disabled = true;}
            _self.data = [tmp];

            // pages buttons
            for(i=1;i<=pagestotal;i++){
                tmp = {value:i};
                if(i===o.pg){tmp.active = true;}
                _self.data.push(tmp);
            }

            // last: increase page button
            tmp = {value:'+'};
            if(pagestotal === o.pg){tmp.disabled = true;}
            _self.data.push(tmp);

            _self.trgt.innerHTML = template(_self.data,_self.range);

        },
        /**
         * @method disable
         * @description adds class to UI, prevents click event
         * */
        disable : function(){
            let _self = this;
            _self.disabled = true;
            _self.trgt.classList.add("disabled");
        },
        /**
         * @method enable
         * @description removes class from UI, enables click event
         * */
        enable  : function () {
            let _self = this;
            _self.trgt.classList.remove("disabled");
        }
    };

    return Pagination;
}));