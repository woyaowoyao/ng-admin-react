import { EventEmitter } from 'events';
import { fromJS, Map, List } from 'immutable';
import AppDispatcher from '../Services/AppDispatcher';

import ApiRequester from '../Services/ApiRequester';

class DatagridStore extends EventEmitter {
    constructor(...args) {
        super(...args);

        this.data = Map({
            pending: true,
            entries: List(),
            sortDir: null,
            sortField: null
        });
    }

    loadData(view) {
        this.data = this.data.update('pending', v => true);
        this.emitChange();

        var sortField = this.sortField || view.sortField() || 'id';
        var sortDir = this.sortDir || view.sortDir() || 'DESC';

        ApiRequester
            .getAll(view, 1, true, [], sortField, sortDir)
            .then(function(data) {
                this.data = this.data.update('entries', (list) => {
                    list = list.clear();
                    data.forEach((entry) => {
                        list = list.push(fromJS(entry));
                    });

                    return list;
                });
                this.data = this.data.update('pending', v => false);
                this.emitChange();
            }.bind(this));
    }

    sort(args) {
        this.data = this.data.update('sortDir', v => args.sortDir);
        this.data = this.data.update('sortField', v => args.sortField);

        return this.loadData(args.view);
    }

    getState() {
        return { data: this.data };
    }

    emitChange() {
        this.emit('datagrid_load');
    }

    addChangeListener(callback) {
        this.on('datagrid_load', callback);
    }

    removeChangeListener(callback) {
        this.removeListener('datagrid_load', callback);
    }
}

let store = new DatagridStore();

AppDispatcher.register((action) => {
  switch(action.actionType) {
    case 'load_data':
      store.loadData(action.view);
      break;
    case 'sort':
      store.sort(action.args);
      break;
  }
});

export default store;