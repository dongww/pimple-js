var Pimple;
(function (Pimple) {
    var Container = (function () {
        function Container(values) {
            if (values === void 0) { values = []; }
            this._values = new Map();
            this._factories = new Set();
            this._protected = new Set();
            this._frozen = new Map();
            this._raw = new Map();
            this._keys = new Map();
            for (var key in values) {
                this.set(key, values[key]);
            }
        }
        Container.prototype.set = function (id, value) {
            if (this._frozen.has(id)) {
                throw new Error("Cannot override frozen service \"" + id + "\".");
            }
            this._values.set(id, value);
            this._keys.set(id, true);
        };
        Container.prototype.get = function (id) {
            if (!this._keys.has(id)) {
                throw new Error("Identifier \"" + id + "\" is not defined.");
            }
            if (this._raw.has(id)
                || !(this._values.get(id) instanceof Object)
                || this._protected.has(this._values.get(id))
                || typeof (this._values.get(id)) != 'function') {
                return this._values.get(id);
            }
            if (this._factories.has(this._values.get(id))) {
                return this._values.get(id)(this);
            }
            var raw = this._values.get(id);
            this._values.set(id, raw(this));
            var val = this._values.get(id);
            this._raw.set(id, raw);
            this._frozen.set(id, true);
            return val;
        };
        Container.prototype.exists = function (id) {
            return this._keys.has(id);
        };
        Container.prototype.unset = function (id) {
            if (this._keys.has(id)) {
                if (this._values.get(id) instanceof Object) {
                    this._factories.delete(id);
                    this._protected.delete(id);
                }
                this._values.delete(id);
                this._frozen.delete(id);
                this._raw.delete(id);
                this._keys.delete(id);
            }
        };
        Container.prototype.factory = function (callable) {
            if (typeof (callable) != 'function') {
                throw new Error("Service definition is not a function.");
            }
            this._factories.add(callable);
            return callable;
        };
        Container.prototype.protect = function (callable) {
            if (typeof (callable) != 'function') {
                throw new Error("Service definition is not a function.");
            }
            this._protected.add(callable);
            return callable;
        };
        Container.prototype.raw = function (id) {
            if (!this._keys.has(id)) {
                throw new Error("Identifier \"" + id + "\" is not defined.");
            }
            if (this._raw.has(id)) {
                return this._raw.get(id);
            }
            return this._values.get(id);
        };
        Container.prototype.extend = function (id, callable) {
            if (!this._keys.has(id)) {
                throw new Error("Identifier \"" + id + "\" is not defined.");
            }
            if (!(this._values.get(id) instanceof Object)
                || typeof (this._values.get(id) != 'function')) {
                throw new Error("Identifier \"" + id + "\" does not contain an object definition.");
            }
            if (!(callable instanceof Object)
                || typeof (callable) != 'function') {
                throw new Error("Extension service definition is not a function");
            }
            var factory = this._values.get(id);
            var extended = function (c) {
                return callable(factory(c), c);
            };
            if (this._factories.has(factory)) {
                this._factories.delete(factory);
                this._factories.add(extended);
            }
            this.set(id, extended);
            return this.get(id);
        };
        Container.prototype.register = function (provider, values) {
            if (values === void 0) { values = []; }
            provider.register(this);
            for (var key in values) {
                this.set(key, values[key]);
            }
            return this;
        };
        return Container;
    }());
    Pimple.Container = Container;
})(Pimple || (Pimple = {}));
//# sourceMappingURL=Container.js.map