# pro-javascript-pagination
```html
<ul id="tst_1_ul"></ul>
```
```javaScript
// initialize
let pagination = new Pagination({
          trgt : document.getElementById('tst_1_ul'),
          state : {pg:1,per:200,total:650},
          onChange : function(v1){
              console.log(v1);
          },
      });

// update
pagination.update({pg:1,per:200,total:2200});

// disable
pagination.disable();

// enable
pagination.enable();
```
