/**
 * Google Geocoder Dropdown for <input> boxes, jQuery plugin
 * (Requires Twitter Typeahead, https://twitter.github.io/typeahead.js/)
 * @author Oleksii Kuznietsov aka utilmind
 * @version 0.1b
 *
 * @example $("input.geo-dropdown").geoDropdown({
 *          });
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lessier General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lessier General Public License for more details.
 *
 * You should have received a copy of the GNU Lessier General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


// ----- geocoder -----
// AK 17.12.2020: It's here because I think that publishing anything as global variable is bad practice.
/* static for all instances
Usage examples:

    geocoder.fetch({
            latLng: new google.maps.LatLng(myLat, myLng)
            // + many other parameters
        },
        function(isOK, result) { // onResult
        },
        function(result) { // onSuccess
        },
        function(status) { // onFailure
        });

    geocoder.fetch({
            address: 'address',
            region: 'region',  // region: country code, eg "BE", or "Belgium", so address will be found within bounds of country or region.
            componentRestrictions: ...
            // + many other parameters
        },
        // onResult
        function(isOK, result) {
        });

    geocoder.fetch({
        placeId: 'some_id'
    });
*/
var geocoder = { // window.geocoder
    // configuration
    // googleApiUrl: "https://maps.googleapis.com/maps/api/js?key=", // try to avoid dynamic load or uncomment + specify an access key.

    // private
    _geocoder: false, // (AK: don't optimize to undefined, don't wrap this object to anonymouse func. There is nothing to optimize. All good as is.)

    // fetch current user location
    fetch: function(params, resultHandler, successHandler, failedHandler) {
        // AK: We don't need to escape or urlEncode anything! Don't break the request with odd garbage!
        // if (params.address)
        //    params.address = encodeURIComponent(params.address);//.replace(/%20/g, "+");

        var me = this,
            fetchLocation = function() {
                me._geocoder.geocode(params, function(results, status) {
                    var isOK = "OK" === status; // or google.maps.GeocoderStatus.OK === status ...or check whether "results" var is initialized.

                    // *before* always
                    if (resultHandler) {
                        resultHandler(isOK, results);
                    }

                    if (isOK) {
                        if (successHandler) {
                            successHandler(results);
                        }
                    }else {
                        if (failedHandler) {
                            failedHandler(status);
                        }
                    }
                });
            };

        if (!me._geocoder) {
            if (window.google) { // Google API loaded?
                me._geocoder = new google.maps.Geocoder();

            }else {
                if (me.googleApiUrl) { // if we allow dynamic load
                    headExtResource(me.googleApiUrl, "script", // UtilMind "commons" required
                        function() { // onLoad
                            me._geocoder = new google.maps.Geocoder();
                            fetchLocation();//params, resultHandler, failedHandler);
                        });
                }
                return;
            }
        }

        fetchLocation();
    },

    addrComponent: function(addressComponents, needleName /* eg "country" */, needShort,
                            /*var*/ i, j, component) {
        for (i in addressComponents) { // iterable array
            component = addressComponents[i];
            for (j in component.types) {
                if (component.types[j] === needleName)
                    return needShort ? component.short_name : component.long_name; // AK: don't optimize! It minimizes perfectly, since "component" is local.
            }
        }
        return ""; // not found
    },
};
// ----- end of geocoder -----


(function(window/*, document*/, $, undefined) {
    var pluginName = "geoDropdown",
        DATA_IS_MODIFIED = "_modified",

        defMinLength = 1,
        defTypeaheadLimit = 8,
        defHint = 1, // true
        defHighlight = 1, // true

        // private
        _alwaysAllowDropdown,
        // only 1 per entire app. We don't need more!
        _googleAcs;

    // CAUTION! TextArea element must be already visible and rendered on first call of autoGrow(), in order to calculate width correctly.
    $.fn[pluginName] = function(options) { // OPTIONS ARE STRICTLY REQUIRED!!
        // Options:
        //      dropdownUnchanged: (boolean). Default is FALSE. The Twitter Typeahead is trying to display the dropdown on any focus.
        //                                   Our default goal is to prevent displaying the dropdown until something changes.
        //                                   However, if you need to display the dropdown immediately on focus, then set "dropdownUnchanged" to TRUE.
        //      limit: Google gives maximum 5, but if data specified, there could be more results. This is total possible number of dropdown items.
        //      data: (object) or (function)
        //      autoCompleteData:
        //      autoCompleteGeodata:
        //      fn[test, input, dropdown,
        //         testGeo, inputGeo, dropdownGeo]

        // if (!options) options = {}; // AK: I don't want to fix it. Options are required, or it will not work at all.
        if (!_googleAcs) {
            doInit(function() {
                if (!window.google) return 1;
                _googleAcs = new google.maps.places.AutocompleteService();
            });
        }

        return this./*once(pluginName).*/each(function() {
            var $this = $(this),
                isInitiallyFocused = $this.is(":focus"), // it may lose focus upon initialization of the Twitter Typeahead. We saving the state to restore it.
                typeaheadLimit = options.limit || defTypeaheadLimit,

                callbackFn = function() {
                    return fVal(options.fn) || {};
                };


            // Twitter Typeahead documentation: https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md
            $this.typeahead({
                hint: options.hint || defHint,
                highlight: options.highlight || defHighlight,
                minLength: options.minLength || defMinLength,
                // async: true, // looks like it's already async by default. We're getting asyncProcess in "source" method.
            }, {
                limit: typeaheadLimit,

                source: function(query, syncProcess, asyncProcess) {
                    var objects = [],
                        cnt = 0,
                        fn = callbackFn(),
                        // regex used to determine if a string contains the substring `q`
                        substrRegex = new RegExp(query.escRegExp(), "i");

                    if (options.data) { // fn.test must be provided, if data used.
                        $.each(fVal(options.data), function(i, obj) {
                            if (fn.test(obj, substrRegex)) {
                                objects.push(obj);
                                ++cnt;
                            }

                            if (cnt === typeaheadLimit) {
                                return false; // break jQuery loop
                            }
                        });
                    }

                    syncProcess(objects);

                    if (_googleAcs && cnt < typeaheadLimit) {
                        // ASYNCHRONOUS results (if limit not reached yet)
                        _googleAcs.getPlacePredictions({
                                input: query,
                                // AK 2023-04-29: I don't want to $.extend({}, options). There is a lots of odd stuff passing together with options. I don't want to pass it to Google. Also I don't want to split options into 2 parts, for typeahead and Places API.
                                types: fVal(options.searchTypes), // must be an array, eg ["neighborhood", "political", "geocode"]. Allowed groups "(regions)", "(cities)" or just "address". See https://developers.google.com/maps/documentation/places/web-service/autocomplete
                                componentRestrictions: fVal(options.componentRestrictions),
                                    // { // allowed restrictions:
                                    //   country: "US", // Unfortunately only 1 country. Array like ['us', 'pr', 'vi', 'gu', 'mp'] allowed only for autocomplete.
                                    //   postalCode: '',
                                    //   administrativeArea: '',
                                    //   locality: '',
                                    //   route: '',
                                    // }
                                bounds: fVal(options.bounds), // allowed function that dynamically generate bounds
                                strictbounds: fVal(options.strictbounds)
                            },
                            function(suggestions, status) {
                                if ("OK" === status) { // alternatively we can check whether suggestions is initialized. Status is "ZERO_RESULTS" when there is nothing to show.
                                    objects = []; // reuse variable from scratch

                                    // Places API returns up to 5 results: https://stackoverflow.com/questions/20785537/google-places-api-returning-only-5-results
                                    var i, place,
                                        struct, secondaryText;

                                    for (i in suggestions) { // let's use retarted ES5 syntax. "in" instead of "of" :(
                                        place = suggestions[i];
                                        if (!fn.testGeo || fn.testGeo(place)) {
                                            struct = place.structured_formatting;

                                            if (secondaryText = struct.secondary_text) { // AK: I don't want country names w/o secondary text.
                                                objects.push({
                                                    id: place.place_id,
                                                    main: struct.main_text,
                                                    sub: secondaryText,
                                                });
                                            }
                                            ++cnt;

                                            if (cnt === typeaheadLimit) break;
                                        }
                                    }

                                    // append the dropdown. WARNING! Typeahead 0.11.1 must be patched as suggested on https://stackoverflow.com/questions/31007825/bootstrap-typeahead-not-showing-hints-as-expected, in order to work properly!
                                    asyncProcess(objects);
                                }
                            }
                        );
                    }
                },

                display: function(obj) { // display in the input box
                    var fn = callbackFn();

                    return obj.sub
                        // google places
                        ? (fn.inputGeo ? fn.inputGeo(obj) : obj.main + ", " + obj.sub) // AK: sub is only specified, since we skipping everything w/o secondary line.
                        // local db
                        : fn.input(obj);
                },

                templates: {
                    suggestion: function(obj) {
                        var fn = callbackFn();

                        return obj.sub
                            // google places (all in 1 line)
                            ? (fn.dropdownGeo
                                    ? fn.dropdownGeo(obj)
                                    : '<div class="s"><i class="far fa-map-marker-alt mr-2 me-2 text-muted"></i>' // support both mr-2 of Bootstrap4 and me-2 of Bootstrap5. But this function is overridable.
                                        + obj.main + ", " + obj.sub
                                        + '</div>')
                            // local db
                            : fn.dropdown(obj);
                    },
                    /*
                    footer: function() {
                        return '<div class="text-right mr-2">powered by Google</div>';
                    }, */
                },

            }).on("typeahead:select typeahead:autocomplete", function(e, obj) {
                // console.log('CLEAR on autocomplete');
                $this.data(DATA_IS_MODIFIED, 0);

                if (obj.sub) {
                    geocoder.fetch({
                        placeId: obj.id
                    }, false, // onResult (any)
                    // onSuccess (only success)
                    function(results) {
                        // close typeahead before the request, before switching to the map
                        $this.typeahead("close");

                        if (options.autoCompleteGeodata)
                            options.autoCompleteGeodata(results[0]);
                    });
                }else if (options.autoCompleteData) {
                    options.autoCompleteData(obj);
                }
            }).on("typeahead:beforeopen", function(e) {
                if (!_alwaysAllowDropdown && !options.dropdownUnchanged && !$this.data(DATA_IS_MODIFIED)
                       // only if not empty. We may allow dropdown if minLength === 0 and input is empty.
                       && (("" !== $this.val()) || (0 !== $this.prop("minLength")))) { // so if you want dropdown on empty input -- set attribute minlength="0".
                    e.preventDefault();
                }

            }).on("keydown", function(e) {
                if (!options.dropdownUnchanged && (40 === e.keyCode)) { // arrow down
                    _alwaysAllowDropdown = 1; // temporary allow dropdown for all instances
                    $this.trigger("focus");
                }
            }).on("blur", function() {
                _alwaysAllowDropdown = 0; // disable temporary kludge for all instances

            }).on("input paste", function() {
                if (!$this.data(DATA_IS_MODIFIED)) {
                    $this.data(DATA_IS_MODIFIED, 1)
                         .trigger("focus");
                }
            }).closest("form") // on parent form.submit
                    .on("reset submit", function() {
                        // console.log('CLEAR on submit');
                        $this.data(DATA_IS_MODIFIED, 0);
                    });

            if (isInitiallyFocused) {
                // if one day jQuery's focus() will not work as expected, use vanilla focus(): $this[0].focus(). (But everything seems to be work nicely.)
                $this.trigger("focus"); // re-focus after initialization of typeahead. ATTN! it may open dropdown, if dropdownUncahnged is TRUE.
            }
        });
    };

})(window, jQuery);