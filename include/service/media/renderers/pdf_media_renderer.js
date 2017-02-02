/*
    Copyright (C) 2016  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
'use strict';

//dependencies
const _ = require('lodash');
const BaseMediaRenderer = require('./base_media_renderer');
const FileUtils = require('../../../../lib/utils/fileUtils');
var HtmlEncoder = require('htmlencode');

    /**
     *
     * @class PdfMediaRenderer
     * @constructor
     */
    class PdfMediaRenderer {

        /**
         * The media type supported by the provider
         * @private
         * @static
         * @property TYPE
         * @type {String}
         */
        static get TYPE() {
            return 'pdf';
        }

        /**
         * The list of supported extensions
         * @private
         * @static
         * @readonly
         * @property SUPPORTED
         * @type {Object}
         */
        static get SUPPORTED() {
            return Object.freeze({
                pdf: {
                    mime: 'application/pdf'
                }
            });
        }

        /**
         * Provides the styles used by each type of view
         * @private
         * @static
         * @property STYLES
         * @type {Object}
         */
        static get STYLES() {
            return Object.freeze({

                view: {
                    'max-width': "100%",
                    'max-height': "500px"
                },

                editor: {
                    width: "350px",
                    height: "350px"
                },

                post: {
                    width: "350px",
                    height: "350px"
                }
            });
        }

        /**
         * Retrieves the supported extension types for the renderer.
         * @static
         * @method getSupportedExtensions
         * @return {Array}
         */
        static getSupportedExtensions  () {
            return Object.keys(PdfMediaRenderer.SUPPORTED);
        }

        /**
         * Retrieves the style for the specified type of view
         * @static
         * @method getStyle
         * @param {String} viewType The view type calling for a styling
         * @return {Object} a hash of style properties
         */
        static getStyle  (viewType) {
            return PdfMediaRenderer.STYLES[viewType] || PdfMediaRenderer.STYLES.view;
        }

        /**
         * Retrieves the supported media types as a hash.
         * @static
         * @method getSupportedTypes
         * @return {Object}
         */
        static getSupportedTypes  () {
            var types = {};
            types[PdfMediaRenderer.TYPE] = true;
            return types;
        }

        /**
         * Retrieves the name of the renderer.
         * @static
         * @method getName
         * @return {String}
         */
        static getName  () {
            return 'PdfMediaRenderer';
        }

        /**
         * Determines if the URL to a media object is supported by this renderer
         * @static
         * @method isSupported
         * @param {String} urlStr
         * @return {Boolean} TRUE if the URL is supported by the renderer, FALSE if not
         */
        static isSupported  (urlStr) {
            var ext = FileUtils.getExtension(urlStr, {lower: true, sep: '/'});
            return PdfMediaRenderer.SUPPORTED[ext] ? true : false;
        }

        /**
         * Gets the specific type of the media resource represented by the provided URL
         * @static
         * @method getType
         * @param {String} urlStr
         * @return {String}
         */
        static getType  (urlStr) {
            return PdfMediaRenderer.isSupported(urlStr) ? PdfMediaRenderer.TYPE : null;
        }

        /**
         * Retrieves the Font Awesome icon class.  It is safe to assume that the type
         * provided will be a supported type by the renderer.
         * @static
         * @method getIcon
         * @param {String} type
         * @return {String}
         */
        static getIcon  (/*type*/) {
            return 'file-pdf-o';
        }

        /**
         * Renders the media resource via the raw URL to the resource
         * @static
         * @method renderByUrl
         * @param {String} urlStr
         * @param {Object} [options]
         * @param {Object} [options.attrs] A hash of all attributes (excluding style)
         * that will be applied to the element generated by the rendering
         * @param {Object} [options.style] A hash of all attributes that will be
         * applied to the style of the element generated by the rendering.
         * @param {Function} cb A callback where the first parameter is an Error if
         * occurred and the second is the rendering of the media resource as a HTML
         * formatted string
         */
        static renderByUrl  (urlStr, options, cb) {
            PdfMediaRenderer.getMediaId(urlStr, function (err, mediaId) {
                if (_.isError(err)) {
                    return cb(err);
                }
                PdfMediaRenderer.render({location: mediaId}, options, cb);
            });
        }

        /**
         * Renders the media resource via the media descriptor object.  It is only
         * guaranteed that the "location" property will be available at the time of
         * rendering.
         * @static
         * @method render
         * @param {Object} media
         * @param {String} media.location The unique resource identifier (only to the
         * media type) for the media resource
         * @param {Object} [options]
         * @param {Object} [options.attrs] A hash of all attributes (excluding style)
         * that will be applied to the element generated by the rendering
         * @param {Object} [options.style] A hash of all attributes that will be
         * applied to the style of the element generated by the rendering.
         * @param {Function} cb A callback where the first parameter is an Error if
         * occurred and the second is the rendering of the media resource as a HTML
         * formatted string
         */
        static render  (media, options, cb) {
            if (_.isFunction(options)) {
                cb = options;
                options = {};
            }

            //try to look up mime if not provided
            var mime = media.mime;
            if (!mime) {

                var extension = PdfMediaRenderer.SUPPORTED[FileUtils.getExtension(media.location, {lower: true})];
                if (extension) {
                    mime = extension.mime;
                }
            }

            //construct HTML snippet
            var embedUrl = PdfMediaRenderer.getEmbedUrl(media.location);
            var html = '<object ' + BaseMediaRenderer.getAttributeStr(options.attrs) + ' ' +
                BaseMediaRenderer.getStyleAttrStr(options.style) +
                ' data="' + HtmlEncoder.htmlEncode(embedUrl) + '"';

            if (mime) {
                html += ' type="' + mime + '">';
            }
            html += '<p>No plugin detected</p></object>';
            cb(null, html);
        }

        /**
         * Retrieves the source URI that will be used when generating the rendering
         * @static
         * @method getEmbedUrl
         * @param {String} mediaId The unique (only to the type) media identifier
         * @return {String} A properly formatted URI string that points to the resource
         * represented by the media Id
         */
        static getEmbedUrl  (mediaId) {
            return BaseMediaRenderer.getEmbedUrl(mediaId);
        }

        /**
         * Retrieves the unique identifier from the URL provided.  The value should
         * distinguish the media resource from the others of this type and provide
         * insight on how to generate the embed URL.
         * @static
         * @method getMediaId
         */
        static getMediaId  (urlStr, cb) {
            cb(null, urlStr);
        }

        /**
         * Retrieves any meta data about the media represented by the URL.
         * @static
         * @method getMeta
         * @param {String} urlStr
         * @param {Boolean} isFile indicates if the URL points to a file that was
         * uploaded to the PB server
         * @param {Function} cb A callback that provides an Error if occurred and an
         * Object if meta was collected.  NULL if no meta was collected
         */
        static getMeta  (urlStr, isFile, cb) {
            var ext = FileUtils.getExtension(urlStr, {lower: true});
            var meta = _.clone(PdfMediaRenderer.SUPPORTED[ext]);
            cb(null, meta);
        }

        /**
         * Retrieves a URI to a thumbnail for the media resource
         * @static
         * @method getThumbnail
         * @param {String} urlStr
         * @param {Function} cb A callback where the first parameter is an Error if
         * occurred and the second is the URI string to the thumbnail.  Empty string or
         * NULL if no thumbnail is available
         */
        static getThumbnail  (urlStr, cb) {
            cb(null, '');
        }

        /**
         * Retrieves the native URL for the media resource.  This can be the raw page
         * where it was found or a direct link to the content.
         * @static
         * @method getNativeUrl
         */
        static getNativeUrl  (media) {
            return media.location;
        }
    }

    //exports
    module.exports = PdfMediaRenderer;
