let capitalise = s => s[0].toUpperCase() + s.slice(1).toLowerCase();

let clamp = (n, min, max) => Math.min(Math.max(n, min), max);

let xhr_error_cb = (url, status, data) => {
  document.open();
  document.write(`${url}:${status}: ${data}`);
  document.close();
};

let get = (url, cb) => {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.onload = () => xhr.status === 200 ? cb(xhr.responseText) : xhr_error_cb(url, xhr.status, xhr.responseText);
  xhr.send();
};

let post = (url, data, cb, mime='application/json;charset=UTF-8') => {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', mime);
  xhr.onload = () => xhr.status === 200 ? cb(xhr.responseText) : xhr_error_cb(url, xhr.status, xhr.responseText);
  xhr.send(data);
};

let find = (sel, pel = document) => {
  let p = 'querySelectorAll';
  if (sel[0] === '#') {
    p = 'getElementById';
    sel = sel.slice(1);
  }
  let ret = pel[p](sel);
  return ret.length === undefined ? ret : (ret.length === 1 ? ret[0] : (ret.length === 0 ? false : ret));
};

let on = (el, action, cb) => {
  el.addEventListener(action, cb);
};

let del = (el) => {
  el.parentNode.removeChild(el);
};

let dom = (t, c = false, v = false) => `<${t}${v ? ' ' + Object.entries(v).map(a => a[0] + '="' + a[1] + '"').join(' ') : ''}${c ? '>' + c + '</' + t + '>' : '/>'}`;

let log = console.log;

let create_window = (id, title, w=0, h=0) => {
  let d = dom('div',
    dom('div',
      dom('div', title || 'Untitled', {'class': 'title-bar-text'}) +
      dom('div', dom('button', '', {'aria-label': 'Close'}), {'class': 'title-bar-controls'}),
    {'class': 'title-bar', 'id': id}) +
    dom('div', '&nbsp;', {'class': 'window-body'}) +
    dom('div', '', {'class': 'window-resize', 'id': id}),
  {'class': 'window window-center', 'id': id});
  document.body.insertAdjacentHTML('beforeend', d);
  let el = find('.window#' + id);
  on(find('.title-bar-controls button', el), 'click', (e) => {
    del(el);
    let mo = find('.tree-view-li#' + id);
    if (mo)
      mo.classList.toggle('opened');
  });
  if (w !== 0 && h !== 0) {
    el.style.width  = w + "px";
    el.style.height = h + "px";
  }
  return el;
};

let draggable = (el) => {
  let x = 0, y = 0, dx = 0, dy = 0;
  
  let init = (e, move_fn) => {
    e = e || window.event;
    e.preventDefault();
    x = e.clientX;
    y = e.clientY;
    document.onmouseup = end;
    document.onmousemove = move_fn;
  };
  
  el.classList.remove('window-center');
  on(find('.title-bar', el), 'mousedown', e => init(e, start_drag));
  on(find('.window-resize', el), 'mousedown', e => init(e, start_resize));
  
  let update = (e) => {
    e = e || window.event;
    e.preventDefault();
    dx = e.clientX - x;
    dy = e.clientY - y;
    x  = e.clientX;
    y  = e.clientY;
  };
  
  let start_drag = (e) => {
    update(e);
    
    let dbbcr = document.body.getBoundingClientRect();
    let dbw = dbbcr.width;
    let dbh = dbbcr.height;
    let elbcr = el.getBoundingClientRect();
    let elw = elbcr.width;
    let elh = elbcr.height;
    let maxx = dbw - elw - 1;
    let maxy = dbh - elh - 1;
    let ww = clamp(el.offsetLeft + dx, 1, maxx);
    let wh = clamp(el.offsetTop  + dy, 1, maxy);
    
    el.style.left = ww + "px";
    el.style.top  = wh + "px";
  };
  
  let start_resize = (e) => {
    update(e);
    
    let cs = getComputedStyle(el, null);
    let nw = Math.max(parseInt(cs.width) + dx, 200);
    let nh = Math.max(parseInt(cs.height) + dy, 200);
    
    el.style.width  = nw + "px";
    el.style.height = nh + "px";
  };
  
  let end = (e) => {
    document.onmouseup = undefined;
    document.onmousemove = undefined;
  };
};

let menu_cb = (e) => {
  let type = e.target.dataset['type'];
  let ttype = capitalise(type.slice(0, -1));
  if (e.target.id === "") {
    let w = find('.window#add_new');
    if (w) {
      find('label#add-new-lbl', w).innerHTML = `Enter ${ttype} Title:`;
      find('input#add-new-item', w).dataset['type'] = type;
    } else {
      w = create_window("add_new", "Add New " + ttype, 300, 80);
      find('.window-body', w).innerHTML = dom('div',
                                            dom('label', `Enter ${ttype} Title:`, {'for': 'add-new-item', 'id': 'add-new-lbl'}) +
                                            dom('input', false, {'type': 'text', 'data-type': type, 'id': 'add-new-item', 'placeholder': 'Title...'}),
                                          {'class': 'field-row-stacked'})
      on(find('#add-new-item'), 'keydown', (e) => {
        if (e.keyCode != 13)
          return;
        post('/api/add',
        JSON.stringify({
          type: e.target.dataset['type'],
          title: e.target.value
        }), (json) => {
          data = JSON.parse(json);
          find(`#${data['type']}_ul`).lastElementChild.insertAdjacentHTML('beforebegin', dom('li', data['title'], {'id': 'id' + data['id'], 'class': 'tree-view-li', 'data-type': data['type']}));
          on(find('.tree-view-li#id' + data['id']), 'click', menu_cb);
          del(find('.window#add_new'));
        });
      });
    }
    return;
  }
  if (type === 'projects')
    return; // TODO
  if (e.target.classList.contains('opened')) {
    e.target.classList.remove('opened');
    del(find('.window#' + e.target.id));
  } else {
    e.target.classList.add('opened');
    let w = create_window(e.target.id);
    draggable(w);
    w.insertAdjacentHTML('beforeend', dom('div',
                                        dom('button', '', {'id': e.target.id, 'class': 'window-edit-btn', 'aria-label': 'Edit'}) +
                                        dom('button', '', {'id': e.target.id, 'class': 'window-delete-btn', 'aria-label': 'Delete'}),
                                      {'class': 'window-actions'}));
    find('.window-body', w).innerHTML = dom('div',
                                          dom('div', 'MARKDOWN', {'class': 'window-content window-mdbox', 'id': e.target.id}) +
                                          dom('div', 'EDIT', {'class': 'window-content window-editbox', 'id': e.target.id, 'contenteditable': 'true'}),
                                        {'id': e.target.id, 'class': 'window-content-container'});
    on(find('.window-delete-btn#' + e.target.id, w), 'click', (e) => {
      // TODO: Delete item from redis
    });
    let web = find('.window-edit-btn#' + e.target.id, w);
    on(web, 'paste', (e) => {
      e.stopPropagation();
      e.preventDefault();
      window.document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('Text'));
    });
    on(web, 'click', (e) => {
      let wmdb = find('.window-mdbox#' + e.target.id);
      let web = find('.window-editbox#' + e.target.id);
      if (getComputedStyle(wmdb, null).display === 'none') {
        let src = web.innerText;
        wmdb.innerHTML = md(emojify(src));
        wmdb.style.display = 'block';
        web.style.display = 'none';
      } else {
        web.style.display = 'block';
        wmdb.style.display = 'none';
      }
    });
  }
};

on(document, 'DOMContentLoaded', (e) => {
  for (let li of find('.tree-view-li'))
    on(li, 'click', menu_cb);
});