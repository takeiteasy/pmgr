let capitalise = s => s[0].toUpperCase() + s.slice(1);

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

let new_draggable = (el) => {
  let x = 0, y = 0, dx = 0, dy = 0;
  let el_id = el.dataset['id'];
  
  let init = (e, move_fn) => {
    e = e || window.event;
    e.preventDefault();
    x = e.clientX;
    y = e.clientY;
    document.onmouseup = end;
    document.onmousemove = move_fn;
  };
  
  document.getElementById(el_id + '_header').addEventListener('mousedown', (e) => {
    init(e, start_drag);
  });
  
  document.getElementById(el_id + '_resize').addEventListener('mousedown', (e) => {
    init(e, start_resize);
  });
  
  document.getElementById(el_id + '_del').addEventListener('click', (e) => {
    // TOOD: Delete entry from redis
  });
  
  document.getElementById(el_id + '_close').addEventListener('click', (e) => {
    el.parentNode.removeChild(el);
    document.getElementById(el_id + '_menu').classList.toggle('opened');
  });
  
  let update = (e) => {
    e = e || window.event;
    e.preventDefault();
    dx = x - e.clientX;
    dy = y - e.clientY;
    x  = e.clientX;
    y  = e.clientY;
  };
  
  let start_drag = (e) => {
    update();
    
    let dbbcr = document.body.getBoundingClientRect();
    let dbw = dbbcr.width;
    let dbh = dbbcr.height;
    let elbcr = el.getBoundingClientRect();
    let elw = elbcr.width;
    let elh = elbcr.height;
    let maxx = dbw - elw - 1;
    let maxy = dbh - elh - 1;
    let ww = clamp(el.offsetLeft - dx, 1, maxx);
    let wh = clamp(el.offsetTop  - dy, 1, maxy);
    
    el.style.left = ww + "px";
    el.style.top  = wh + "px";
  };
  
  let start_resize = (e) => {
    update();
    
    let bcr = el.getBoundingClientRect();
    let nw = Math.max(bcr.width - dx, 200);
    let nh = Math.max(bcr.height - dy, 200);
    
    el.style.width  = nw + "px";
    el.style.height = nh + "px";
  };
  
  let end = (e) => {
    document.onmouseup = undefined;
    document.onmousemove = undefined;
  };
};

let new_window = (id, type) => {
  if (type === 'projects') {
    // TODO: Project window handling
  } else {
    let window = document.createElement('div');
    window.classList = ['window'];
    window.id = id + '_window';
    window.dataset['id'] = id
    let window_cont = document.createElement('div');
    window_cont.classList = ['window_cont'];
    let window_head = document.createElement('div');
    window_head.classList = ['window_head'];
    window_head.id = id + '_header';
    let window_title = document.createElement('span');
    window_title.classList = ['window_title'];
    window_title.innerHTML = 'test <b>[test]</b>';
    let window_controls = document.createElement('div');
    window_controls.classList = ['window_controls'];
    let window_edit = document.createElement('div');
    window_edit.id = id + '_edit';
    window_edit.classList = ['window_ctrl'];
    window_edit.innerText = 'edit';
    let window_del = document.createElement('div');
    window_del.id = id + '_del';
    window_del.classList = ['window_ctrl'];
    window_del.innerText = 'del';
    let window_close = document.createElement('div');
    window_close.id = id + '_close';
    window_close.classList = ['window_close button'];
    window_close.innerText = 'X';
    let window_body_cont = document.createElement('div');
    window_body_cont.classList = ['window_body_cont'];
    let window_body = document.createElement('div');
    window_body.classList = ['window_body'];
    let window_resize = document.createElement('div');
    window_resize.classList = ['window_resize'];
    window_resize.id = id + '_resize';
  
    window_head.appendChild(window_title);
    window_controls.appendChild(window_edit);
    window_controls.appendChild(window_del);
    window_controls.appendChild(window_close);
    window_head.appendChild(window_controls);
    window_cont.appendChild(window_head);
    window_body_cont.appendChild(window_body);
    window_cont.appendChild(window_body_cont);
    window.appendChild(window_cont);
    window.appendChild(window_resize);
  
    // TODO: Store width, height, x, y, opened
    let ww = 640, wh = 480;
    let dbbcr = document.body.getBoundingClientRect();
    let wx = dbbcr.width / 2  - ww / 2;
    let wy = dbbcr.height / 2 - wh / 2;
  
    window.style.left   = wx + "px";
    window.style.top    = wy + "px";
    window.style.width  = ww + "px";
    window.style.height = wh + "px";
  
    document.body.appendChild(window);
    
    get('/api/get/' + type + '/' + id, (json) => {
      get('/data/' + id + '.md', (data) => {
        console.log(data);
      });
    });
  
    return window;
  }
};

let menu_object_cb = (e) => {
  let type = e.target.dataset['type'];
  let id = e.target.dataset['id'];
  if (type === 'projects') {
    // TODO: Handle project window opening/closing
    let li = document.getElementById('projects_menu').getElementsByTagName('li');
    for (let i = 0; i < li.length; i++) {
      if (li[i].firstElementChild === e.target)
        continue;
      li[i].firstElementChild.classList.remove('opened');
    }
  } else {
    if (e.target.classList.contains('opened')) {
      e.target.classList.remove('opened');
      let window_el = document.getElementById(id + '_window');
      window_el.parentNode.removeChild(window_el);
    } else {
      e.target.classList.add('opened');
      new_draggable(new_window(id, type)); // TODO: Merge new_draggable with new_window
    }
  }
};

document.addEventListener('DOMContentLoaded', (e) => {
  for (var o of document.getElementsByClassName('caret'))
    o.addEventListener('click', (e) => {
      e.target.parentElement.querySelector('.nested').classList.toggle('inactive');
      e.target.classList.toggle('caret-down');
    });
  
  let menu = document.getElementById('menu');
  document.getElementById('show_menu').addEventListener('click', (e) => {
    menu.style.visibility = 'visible';
  });
  
  document.getElementById('hide_menu').addEventListener('click', (e) => {
    menu.style.visibility = 'hidden';
  });
  
  let add = document.getElementsByClassName('add');
  let add_box = document.getElementById('add');
  let add_title = document.getElementById('add_title');
  let search = document.getElementById('search');
  let search_type = document.getElementById('search_type');
  
  for (let o of add)
    o.addEventListener('click', (e) => {
      let type = e.target.dataset['type'];
      add_title.innerText = "Add to " + capitalise(type);
      search_type.value = type;
      if (add_box.classList.contains('inactive'))
        add_box.classList.remove('inactive');
    });

  document.getElementById('add_close').addEventListener('click', (e) => {
    add_box.classList.toggle('inactive');
  });
  search.addEventListener('keydown', (e) => {
    if (e.keyCode != 13)
      return;

    let type = search_type.value;
    post('/api/add',
    JSON.stringify({
      type: type,
      title: search.value
    }), (json) => {
      data = JSON.parse(json);
      let li = document.createElement('li');
      let span = document.createElement('span');
      span.classList = ['object'];
      span.id = data['id'] + '_menu';
      span.dataset['type'] = data['type'];
      span.dataset['id'] = data['id'];
      span.innerText = data['title'];
      span.addEventListener('click', menu_object_cb);
      li.appendChild(span);
      document.getElementById(data['type'] + '_menu').appendChild(li);
      add_box.classList.toggle('inactive');
    });
    search.value = '';
  });
  
  for (var o of document.getElementsByClassName('object'))
    o.addEventListener('click', menu_object_cb);
});