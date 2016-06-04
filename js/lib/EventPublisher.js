/*
*   Copyright (c) 2015 Particle Industries, Inc.  All rights reserved.
*
*   This program is free software; you can redistribute it and/or
*   modify it under the terms of the GNU Lesser General Public
*   License as published by the Free Software Foundation, either
*   version 3 of the License, or (at your option) any later version.
*
*   This program is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
*   Lesser General Public License for more details.
*
*   You should have received a copy of the GNU Lesser General Public
*   License along with this program; if not, see <http://www.gnu.org/licenses/>.
*/


var when = require('when');
var extend = require('xtend');
var settings = require("../settings");
var logger = require('./logger.js');
var utilities = require("./utilities.js");
var EventEmitter = require('events').EventEmitter;

var EventPublisher = function () {
    EventEmitter.call(this);
};
EventPublisher.prototype = {
    getEventKey: function(name,userid,coreid){
        var ret = userid;
        if(coreid){
            ret+='_'+coreid;
        }
        if(name){
            ret +='_'+name;
        }
        return ret;
    },
    getEventName:function(name,coreid){
        var eventName="";
        if(coreid){
            eventName=coreid;
            if(name && (name!="")){
                eventName+='/'+name;
            }
        }else if(name && (name!="")){
            eventName=name;
        }
        if (!eventName || (eventName == "")) {
            return "*all*";
        }
        return eventName;
    },
    publish: function (isPublic, name, userid, data, ttl, published_at, coreid) {

        process.nextTick((function () {
            if (typeof(this.emit) == 'function')
            {
                this.emit( name, isPublic, name, userid, data, ttl, published_at, coreid );
                this.emit( coreid, isPublic, name, userid, data, ttl, published_at, coreid );
                this.emit( coreid + '/' + name, isPublic, name, userid, data, ttl, published_at, coreid );
                this.emit( "*all*", isPublic, name, userid, data, ttl, published_at, coreid );
            }
        }).bind(this));
    },
    subscribe: function (name,userid,coreid, obj,objHandler) {
        var key=this.getEventKey(name,userid,coreid ),
          eventName;
        //coreid/name
        //coreid
        //name
        if(!obj[key + "_handler"]) {
            eventName=this.getEventName(name,coreid);
            var handler;
            if(objHandler){
                handler = objHandler.bind(obj);
            }else {
                handler = (function ( isPublic,
                                          name,
                                          userid,
                                          data,
                                          ttl,
                                          published_at,
                                          coreid
                ) {
                    var emitName = (isPublic) ? "public" : "private";
                    if (typeof(this.emit) == 'function') {
                        this.emit( emitName, name, data, ttl, published_at, coreid );
                    }
                }).bind( obj );
            }
            obj[key + "_handler"] = handler;

            this.on( eventName, handler );
        }
    },

    unsubscribe: function (name,userid,coreid, obj) {
        var key = this.getEventKey(name,userid,coreid);
        if(key) {
            var handler = obj[key + "_handler"];
            if ( handler ) {
                var eventName = this.getEventName(name,coreid);
                delete obj[eventName + "_handler"];
                this.removeListener( eventName, handler );
            }
        }
    },


    close: function () {
        try {
            this.removeAllListeners();
        }
        catch (ex) {
            logger.error("EventPublisher: error thrown during close " + ex);
        }
    }
};
EventPublisher.prototype = extend(EventPublisher.prototype, EventEmitter.prototype);
module.exports = EventPublisher;

