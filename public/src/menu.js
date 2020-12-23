const menu = {
  /** Open File */
  openFile: {
    _: document.getElementById('popup-open-file'),
    fl: document.getElementById('file-list'),

    showPopup(show) {
      if (show) socket.fileList.request(this.populateFileList.bind(this));
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    populateFileList(files) {
      let div = document.createElement('div'), span, a;
      for (let file of files) {
        span = document.createElement('span');
        span.insertAdjacentHTML('beforeend', '&#128462; ');
        a = document.createElement('a');
        a.href = 'javascript:void(0);';
        a.innerText = file.name;
        a.setAttribute('title', `${file.size} bytes ${file.protected ? '(password protected)' : ''}`);
        a.addEventListener('click', () => { this.showPopup(false); this.open(file); });
        span.insertAdjacentElement('beforeend', a);
        div.insertAdjacentElement('beforeend', span);
        div.insertAdjacentHTML('beforeend', '<br>');
      }
      this.fl.innerHTML = '';
      this.fl.insertAdjacentElement('beforeend', div);
    },

    /**
     * Load file into workspace
     * @param {object | string} file - File to load into workspace (file object or file name)
     */
    open(file) {
      if (app.file.open) {
        alert("A file is already open");
      } else {
        if (typeof file == 'string') file = { name: file };
        let passwd = file.protected ?
          file.passwd == undefined ?
            window.prompt(`File ${file.name} is protected. Enter password to open.`) : null
          : file.passwd;
        socket.getFile.request(file.name, passwd, data => {
          app.file.open = true;
          app.file.name = data.name;
          app.file.data = data.data;
          app.file.passwd = passwd;
          app.openWorkspace();
        });
      }
    },
  },

  /**
   * Save file app.file.name
   * @param {boolean} closeAfter  Close file after save?
   */
  saveFile(closeAfter) {
    if (app.workspace) {
      if (app.file.name) {
        try {
          let data = app.workspace.toObject();
          data = JSON.stringify(data);
          socket.writeFile.request(app.file.name, app.file.passwd, data, closeAfter);
          return true;
        } catch (e) {
          console.error(e);
          app.message(`Error saving ${app.file.name}`, ERROR);
          return false;
        }
      } else {
        menu.saveAs.showPopup(true);
      }
    } else {
      app.message('Nothing to save', ERROR);
      return false;
    }
  },

  /** Save As */
  saveAs: {
    _: document.getElementById('popup-saveas'),
    inputName: document.getElementById('saveas-name'),
    inputPasswd: document.getElementById('saveas-passwd'),
    openAfter: true, // Flag for callback - open file after saveAs?

    showPopup(show) {
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    save() {
      if (app.workspace) {
        let name = this.inputName.value;
        let passwd = this.inputPasswd.value;
        let data = JSON.stringify(app.workspace.toObject());

        app.file.open = true;
        app.file.name = name;
        app.file.passwd = passwd;
        app.file.data = data;
        app.workspace = null;
        socket.newFile.request(name, passwd, data);
      } else app.message("No workspace to save", ERROR);
    }
  },

  /** Closing the file */
  exitFile: {
    _: document.getElementById('popup-exit-save'),
    closeAfterSave: false, // Close file after saving?

    showPopup(show) {
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    /**
     * @param {boolean} ignore  Ignore not-up-to-date-ness
     * @default ignore=false
     */
    exit(ignore = false) {
      if (app.workspace) {
        if (app.file.name && !ignore && app.workspace.contentAltered) {
          // Not up-to-date... Prompt to save
          this.showPopup(true);
        } else {
          app.closeWorkspace();
        }
      } else {
        app.message('No workspace to close', ERROR);
      }
    },

    /**
     * Close popup, with a flag
     * @param {boolean} save    Save file before closing?
     */
    popupBtn(save) {
      this.showPopup(false);
      if (save) {
        this.closeAfterSave = true;
        menu.saveFile();
      } else {
        this.exit(true);
      }
    }
  },

  /** Delete a file */
  deleteFile: {
    _: document.getElementById('popup-delete-file'),
    numShow: document.getElementById('delete-file-num'),
    inputNum: document.getElementById('delete-file-num-input'),

    /** To delete, number must be types by user */
    num: NaN,

    showPopup(show) {
      if (show) {
        if (app.opts.readonly) return readonlyMsg();
        this.num = Math.floor(Math.random() * 1e6);
        this.numShow.innerText = this.num;
      } else {
        this.inputNum.value = '';
      }

      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    delete() {
      if (app.workspace) {
        if (app.opts.readonly) return readonlyMsg();
        if (app.file.name) {
          if (this.num != +this.inputNum.value) {
            this.showPopup(false);
            app.message(`Entered number was incorrect`, ERROR);
          } else {
            this.showPopup(false);
            socket.deleteFile.request(app.file.name, app.file.passwd);
          }
        } else {
          this.showPopup(false);
          app.closeWorkspace();
        }
      } else {
        app.message('Nothing to delete', ERROR);
      }
    }
  },

  toggleNav() {
    hide(app.html.nav, !isHidden(app.html.nav));
  },

  advancedOpts: {
    _: document.getElementById('popup-adv-opts'),
    gridSize: document.getElementById('ao-grid-size'),
    gridSizeVal: document.getElementById('ao-grid-size-val'),
    curviness: document.getElementById('ao-curviness'),
    curvinessVal: document.getElementById('ao-curviness-val'),
    cnodew: document.getElementById('ao-cnodew'),
    cnodewVal: document.getElementById('ao-cnodew-val'),
    colouredWires: document.getElementById('ao-coloured-wires'),
    blabels: document.getElementById('ao-blabels'),
    cpreview: document.getElementById('ao-cpreview'),
    cpreviewVal: document.getElementById('ao-cpreview-val'),
    readonly: document.getElementById('ao-readonly'),
    debug: document.getElementById('ao-debug'),

    init() {
      this.gridSize.addEventListener('input', event => {
        app.opts.gridw = +event.target.value;
        menu.advancedOpts.gridSizeVal.innerText = event.target.value;
      });
      this.curviness.addEventListener('input', event => {
        app.opts.curviness = +event.target.value;
        menu.advancedOpts.curvinessVal.innerText = event.target.value;
      });
      this.cnodew.addEventListener('input', event => {
        app.opts.cnodew = +event.target.value;
        menu.advancedOpts.cnodewVal.innerText = event.target.value;
      });
      this.colouredWires.addEventListener('change', event => app.opts.colourConns = event.target.checked);
      this.blabels.addEventListener('change', event => app.opts.showBLabels = event.target.checked);
      this.cpreview.addEventListener('input', event => {
        app.opts.commentPreview = +event.target.value;
        menu.advancedOpts.cpreviewVal.innerText = event.target.value;
      });
      this.readonly.addEventListener('change', event => app.opts.readonly = event.target.checked);
      this.debug.addEventListener('change', event => app.opts.debug = event.target.checked);
      this.update();
    },

    showPopup(show) {
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    /** Update visual elements to current opt config */
    update() {
      this.cnodewVal.innerText = app.opts.cnodew;
      this.cnodew.value = app.opts.cnodew;
      this.curvinessVal.innerText = app.opts.curviness;
      this.curviness.value = app.opts.curviness;
      this.gridSizeVal.innerText = app.opts.gridw;
      this.gridSize.value = app.opts.gridw;
      this.colouredWires.checked = app.opts.colourConns;
      this.blabels.checked = app.opts.showBLabels;
      this.cpreview.value = app.opts.commentPreview;
      this.cpreviewVal.innerText = app.opts.commentPreview;
      this.readonly.checked = app.opts.readonly;
      this.debug.checked = app.opts.debug;
    },

    /** Reset to original options */
    reset() {
      app.setOptData(app.defaultOptData());
      this.update();
    }
  },

  /** Popup for commentBox component */
  commentBox: {
    _: document.getElementById('popup-comment-box'),
    textarea: document.getElementById('comment-box-text'),
    obj: null,

    open(box) {
      this.obj = box;
      hide(app.html.cover, false);
      hide(this._, false);
      if (app.opts.readonly) this.textarea.setAttribute('readonly', 'readonly'); else this.textarea.removeAttribute('readonly');
      this.textarea.value = box.text;
      this.textarea.focus();
    },

    close() {
      hide(app.html.cover, true);
      hide(this._, true);
      if (this.obj && !app.opts.readonly) {
        if (this.obj.text != this.textarea.value) app.workspace.contentAltered = true;
        this.obj.text = this.textarea.value;
        this.obj = null;
      }
      this.textarea.value = '';
    },
  },

  /** Download canvas as image */
  downloadImage() {
    let image = app.p5canvas.elt.toDataURL("image/png").replace("image/png", "image/octet-stream");
    // window.open(image);
    window.location.href = image;
  },

  share: {
    _: document.getElementById('popup-share'),
    fileLink: document.getElementById('download-file-a'),

    showPopup(show) {
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    /** Download as image */
    image() {
      let image = app.p5canvas.elt.toDataURL("image/png").replace("image/png", "image/octet-stream");
      window.open(image);
      this.showPopup(false);
    },

    file() {
      let text = JSON.stringify(app.workspace.toObject());
      let data = new Blob([btoa(text)], { type: 'text/plain' });
      let url = window.URL.createObjectURL(data);
      this.fileLink.href = url;
      this.fileLink.click();
      this.showPopup(false);
    },

    print() {
      this.showPopup(false);
      this.print_setup(true);
      window.print();
      this.print_setup(false);
    },

    print_setup(hideStuff) {
      hide(app.html.nav, hideStuff);
      hide(app.statusbar._, hideStuff);
      hide(app.html.menuBar, hideStuff);
    },
  },

  uploadFile: {
    _: document.getElementById('popup-upload'),
    input: document.getElementById('upload-input'),

    showPopup(show) {
      hide(app.html.cover, !show);
      hide(this._, !show);
    },

    upload() {
      if (this.input.files.length == 1) {
        let file = this.input.files[0];
        let name = file.name;
        if (name.substr(name.length - 4, 4) != '.lgc') return app.message('File must be .lgc', ERROR);
        name = name.substring(0, name.length - 4);

        let freader = new FileReader();
        freader.onload = event => {
          this.showPopup(false);
          const data = atob(event.target.result);
          menu.saveAs.openAfter = true;
          app.file.open = false;
          app.file.name = name;
          app.file.data = data;
          socket.newFile.request(name, null, data);
        };
        freader.readAsBinaryString(file);
      } else {
        app.message('Please select one file to upload', INFO);
      }
    },
  },

  /** Boolean algebraic representation of circuit */
  boolAlgebra: {
    _: document.getElementById('popup-bool-algebra'),
    target: document.getElementById('bool-algebra-text'),

    /**
     * @param {boolean} show - Show popup?
     * @param {Component | undefined} obj - Which component to who algebra for?
     */
    popup(show, obj = undefined) {
      hide(app.html.cover, !show);
      hide(this._, !show);

      if (show) {
        if (obj) {
          this.target.innerHTML = this.write(obj);
        } else {
          this.target.innerHTML = this.writeAll().join('<br>');
        }
      } else {
        this.target.innerHTML = '';
      }
    },

    /** Populate textarea with algebra for provided component */
    write(c) {
      let algebra = c.backtrace();
      let subbed = c.backtrace(true);
      while (algebra[0] == '(') {
        algebra = algebra.substr(1, algebra.length - 2);
        subbed = subbed.substr(1, subbed.length - 2);
      }
      let line = algebra + ' = ' + subbed + ' = ' + c.state;
      return line;
    },

    /** Populate textarea with algebra for all outputs */
    writeAll() {
      let lines = [];
      app.workspace.forEachComponent(c => {
        if (c instanceof Output) lines.push(c.label + ' = ' + this.write(c));
      });
      return lines;
    },
  },

  traceTable: {
    _: document.getElementById('popup-trace-table'),
    table: document.getElementById('trace-table'),

    popup(show) {
      hide(app.html.cover, !show);
      hide(this._, !show);
      if (show) {
        this.table.innerHTML = this.generate();
      }
    },

    generate() {
      let html;
      noLoop(); // Stop rendering to reduce lag
      {

        // Array of inputs/outputs
        const components = Object.values(app.workspace._els);
        const inputs = components.filter(c => c instanceof Input), outputs = components.filter(c => c instanceof Output);

        // Labels
        html = `<thead><tr><th colspan='${inputs.length}'>Inputs</th><th colspan='${outputs.length}'>Outputs</th></tr><tr>`;
        for (const input of inputs) html += `<th>${input.label}</th>`;
        for (const output of outputs) html += `<th>${output.label}</th>`;
        html += '</thead>';

        // Record original states
        const originalStates = inputs.map(c => c.state);

        const inputStates = getCombos(inputs.length);
        const outputStates = [];
        for (const states of inputStates) {
          // Set states
          for (let i = 0; i < states.length; i++) inputs[i].state = states[i];
          app.workspace.evaluate();

          // Get output states
          outputStates.push(outputs.map(c => c.state));
        }

        html += '<tbody>';
        for (let i = 0; i < inputStates.length; i++) {
          html += '<tr>';
          for (let j = 0; j < inputStates[i].length; j++) html += `<td>${getHTMLState(inputStates[i][j])}</td>`;
          for (let j = 0; j < outputStates[i].length; j++) html += `<td>${getHTMLState(outputStates[i][j])}</td>`;
          html += '</tr>';
        }
        html += '</tbody>';

        // Reset states
        for (let i = 0; i < inputs.length; i++) inputs[i].state = originalStates[i];
      }
      loop();
      return html;
    },
  },
};