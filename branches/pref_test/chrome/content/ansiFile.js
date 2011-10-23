function AnsiFile(ansiColor) {
    this.ansi = ansiColor;
    this.listener = ansiColor.listener;

    this.downloadTimer = null;
    this.downloadInterval = 100; // in mini second
    this.isLineFeed = false;
    this.downloadedArticle = [];
}

AnsiFile.prototype = {
    openFile: function() {
        //FIXME: load file with different charset
        var data = this.loadFile();
        if(!data)
            return;

        var text = this.ansi.convertStringToUTF8(data);
        this.ansi.ansiClipboard(text);
        this.ansi.paste();
    },

    savePage: function() {
        //FIXME: save file with different charset
        if(this.listener.view.selection.hasSelection()) {
            var data = this.ansi.getSelText();
            this.saveFile(data, false);
            if(this.listener.prefs.ClearCopiedSel)
                this.listener.view.selection.cancelSel(true);
        } else {
            var stringBundle = this.listener.stringBundle;
            var noColor = confirm(stringBundle.getString("save_without_color"));
            this.downloadArticle(noColor);
        }
    },

    loadFile: function() {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"]
                           .createInstance(nsIFilePicker);
        fp.init(window, null, nsIFilePicker.modeOpen);
        fp.appendFilters(nsIFilePicker.filterAll);
        if(fp.show() == nsIFilePicker.returnCancel)
            return '';
        if(!fp.file.exists())
            return '';

        var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                                .createInstance(Components.interfaces.nsIFileInputStream);
        // Read data with 2-color DBCS char
        fstream.init(fp.file, -1, -1, false);

        var bstream = Components.classes["@mozilla.org/binaryinputstream;1"]
                      .createInstance(Components.interfaces.nsIBinaryInputStream);
        bstream.setInputStream(fstream);
        var bytes = bstream.readBytes(bstream.available());

        return bytes;
    },

    saveFile: function(data, noColor) {
        if(noColor)
            data = data.replace(/\x1b\[[0-9;]*m/g, '');
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        fp.init(window, null, nsIFilePicker.modeSave);
        fp.defaultExtension = noColor ? 'txt' : 'ans';
        fp.defaultString = noColor ? 'newtext' : 'newansi';
        fp.appendFilters(nsIFilePicker.filterAll);
        if (fp.show() == nsIFilePicker.returnCancel)
            return;

        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                                 .createInstance(Components.interfaces.nsIFileOutputStream);
        foStream.init(fp.file, 0x02 | 0x08 | 0x20, 0666, 0);
        foStream.write(data, data.length);
        if (foStream instanceof Components.interfaces.nsISafeOutputStream)
            foStream.finish();
        else
            foStream.close();
    },

    // Modified from pcmanx-gtk2
    downloadArticle: function(noColor) {
        if(this.isDownloading())
            this.stopDownload();
        for(var row = 0; row < this.listener.buf.rows-1; ++row) {
            var text = this.ansi.getText(row, 0, this.listener.buf.cols, false);
            this.downloadedArticle.push(text);
        }
        if(this.checkFinish(noColor))
            return;
        this.listener.conn.send('\x1b[B');
        var _this = this;
        this.downloadTimer = setTimer(true, function() {
            if(!_this.checkNewLine())
                return;
            if(!_this.checkFinish(noColor))
                _this.listener.conn.send('\x1b[B');
        }, this.downloadInterval);
    },

    // Modified from pcmanx-gtk2
    checkNewLine: function() {
        var buf = this.listener.buf;
        if(!this.isLineFeed || buf.row < buf.rows-1 || buf.col < 40)
            return false; // not fully received

        var text = this.ansi.getText(buf.rows-2, 0, buf.cols, false);

        // Hack for the double-line separator of PTT
        // Not always works, such as that repeated lines may not be detected
        // disabling double-line separator is recommended
        var downloaded = this.downloadedArticle[this.downloadedArticle.length-1];
        var lastline = this.ansi.getText(buf.rows-3, 0, buf.cols, false);
        if(downloaded != lastline) {
            var lastlastline = this.ansi.getText(buf.rows-4, 0, buf.cols, false);
            if(downloaded == lastlastline)
                this.downloadedArticle.push(lastline);
        }

        this.downloadedArticle.push(text);
        this.isLineFeed = false;
        return true;
    },

    // Modified from pcmanx-gtk2
    checkFinish: function(noColor) {
        var buf = this.listener.buf;
        if(buf.getRowText(buf.rows-1, 0, buf.cols).indexOf("100%") < 0)
            return false;
        var data = this.downloadedArticle.join('\n');
        if(this.listener.os == 'WINNT') // handle CRLF
            data = data.replace(/\n/g, "\r\n");
        this.stopDownload(true);

        var text = this.ansi.convertStringToUTF8(data);
        if(noColor) {
            text = text.replace(/\x1b\[[0-9;]*m/g, '');
            this.ansi.systemClipboard(text);
        } else {
            this.ansi.ansiClipboard(text);
        }

        this.saveFile(data, noColor);
        return true;
    },

    stopDownload: function(normal) {
        if(!this.isDownloading())
            return;

        if(!normal) {
            var stringBundle = this.listener.stringBundle;
            alert(stringBundle.getString("download_stopped"));
        }

        this.downloadTimer.cancel();
        this.downloadTimer = null;
        this.isLineFeed = false;
        this.downloadedArticle = [];
    },

    isDownloading: function() {
        return (this.downloadTimer != null);
    },

    getLineFeed: function() {
        this.isLineFeed = true;
    }
}