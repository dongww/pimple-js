namespace Pimple {
    export interface ServiceProviderInterface {
        register(container: Container);
    }

    export class Container {
        private _values = new Map();
        private _factories = new Set();
        private _protected = new Set();
        private _frozen = new Map();
        private _raw = new Map();
        private _keys = new Map();

        constructor(values = []) {
            for (let key in values) {
                this.set(key, values[key]);
            }
        }

        set(id, value) {
            if (this._frozen.has(id)) {
                throw new Error(`Cannot override frozen service "${id}".`)
            }

            this._values.set(id, value);
            this._keys.set(id, true);
        }

        get(id) {
            if (!this._keys.has(id)) {
                throw new Error(`Identifier "${id}" is not defined.`)
            }

            if (
                this._raw.has(id)
                || !(this._values.get(id) instanceof Object)
                || this._protected.has(this._values.get(id))
                || typeof(this._values.get(id)) != 'function'
            ) {
                return this._values.get(id);
            }

            if (this._factories.has(this._values.get(id))) {

                return this._values.get(id)(this);
            }

            let raw = this._values.get(id);

            this._values.set(id, raw(this));
            let val = this._values.get(id);

            this._raw.set(id, raw);

            this._frozen.set(id, true);

            return val;
        }

        exists(id) {
            return this._keys.has(id);
        }

        unset(id) {
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
        }

        factory(callable) {
            if (typeof (callable) != 'function') {
                throw new Error(`Service definition is not a function.`);
            }

            this._factories.add(callable);

            return callable;
        }

        protect(callable) {
            if (typeof(callable) != 'function') {
                throw new Error(`Service definition is not a function.`);
            }

            this._protected.add(callable);

            return callable;
        }

        raw(id) {
            if (!this._keys.has(id)) {
                throw new Error(`Identifier "${id}" is not defined.`);
            }

            if (this._raw.has(id)) {
                return this._raw.get(id);
            }

            return this._values.get(id);
        }

        extend(id, callable) {
            if (!this._keys.has(id)) {
                throw new Error(`Identifier "${id}" is not defined.`);
            }

            if (
                !(this._values.get(id) instanceof Object)
                || typeof(this._values.get(id) != 'function')
            ) {
                throw new Error(`Identifier "${id}" does not contain an object definition.`);
            }

            if (
                !(callable instanceof Object)
                || typeof(callable) != 'function'
            ) {
                throw new Error(`Extension service definition is not a function`);
            }

            let factory = this._values.get(id);
            let extended = (c) => {
                return callable(factory(c), c);
            };

            if (this._factories.has(factory)) {
                this._factories.delete(factory);
                this._factories.add(extended);
            }

            this.set(id, extended);
            return this.get(id);
        }

        register(provider: ServiceProviderInterface, values = []) {
            provider.register(this);

            for (let key in values) {
                this.set(key, values[key]);
            }

            return this;
        }
    }
}