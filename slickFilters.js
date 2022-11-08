$.fn.slickFilters = function(options) {

	var defaults = {
		slickFilter: true,
		processing: true,
		serverSide: true,
		autoWidth: false,
		orderCellsTop: true,
		language: {
			lengthMenu: '<span class="d-inline-block">Show&nbsp;</span> <select class="form-select d-inline-block my-0" style="width:100px;">' +
			'<option value="10">10</option>' +
			'<option value="25">25</option>' +
			'<option value="50">50</option>' +
			'<option value="100">100</option>' +
			'</select>',
			//sInfoFiltered: '',
			sInfo: 'Showing _START_ to _END_ of _TOTAL_ Results',
		},
		dom: "<'row' <'col'>>t<'row p-3' <'col'i><'col text-end align-items-top'l><'col-auto'p>>",
	}

	//OVERRIDE SERVERSIDE
	if (typeof(options.ajax) === 'undefined') {
		defaults.serverSide = false;
		defaults.processing = false;
	}

	//BUILD THE OPTIONS
	var options = $.extend(true, defaults, options);

	//GET THE TABLE
	var table = $(this);

	//CHECK IF SLICK FILTERS SHOULD RUN
	if (options.slickFilter === false) return $(table).DataTable(options);

	//CLONE THE HEADER ROW
	$('thead tr', $(table)).clone(true).addClass('slick-datatable-filters').css('opacity', '0').appendTo($('thead', $(table)));

	//SEND BACK THE DATA TABLE
	return $(table).on('preInit.dt', function(e, settings) {

		//INITIALIZE RANGES
		var ranges = [];

		//GET THE API
		var api = new $.fn.dataTable.Api(settings);

		//LOOP THROUGH THE FIRST ROW OF EACH COLUMN
		api.columns().eq(0).each(function(colIdx) {

			//GET THE TITLE AND CELL 
			var title = $('.slick-datatable-filters th', table).eq($(api.column(colIdx).header()).index()).text();
			var cell = $('.slick-datatable-filters th', table).eq($(api.column(colIdx).header()).index()).empty();

			$(cell).css('vertical-align', 'top');

			//FORMAT HTML5 DATA ATTRIBUTES
			[].forEach.call($(cell)[0].attributes, function(attr) {
				if (/^data-/.test(attr.name)) $(cell).data(attr.name.substr(5).replace(/-(.)/g, function($0, $1) {
					return $1.toUpperCase();
				}), attr.value);
			});

			//FLAG AS FILTERABLE OR NOT
			var filterable = $(cell).data('filterable') == 'false' ? false : true;

			//DEFAULT TO NO FILTER RENDERED
			var filterRendered = false;

			//IF FILTERABLE
			if (filterable) {

				//GET THE COLUMN DATA
				colInfo = $.extend(true, $(cell).data(), options.columns[colIdx]);

				//HANDLE SELECT FILTERS
				if (colInfo.sfFilter == 'select') {

					if (typeof(colInfo.sfSelectOptions) == 'object') {

						//HANDLE AUTOCOMPLETE
						if (typeof(colInfo.sfSelectOptions.ajax) !== 'undefined') {
							//BUILD AUTOCOMPLETE LOGIC HERE
						}

						//NO AUTOCOMPLETE SO PARSE OBJECT OR ARRAY
						else {

							//INITIALIZE THE DROPDOWN
							var selectInput = $('<select class="form-select form-select-sm"><option value="">All</option></select>');

							//BUILD THE DROPDOWN OPTIONS
							for ([key, value] of Object.entries(colInfo.sfSelectOptions)) $(selectInput).append('<option value="' + (Array.isArray(colInfo.sfSelectOptions) ? value : key) + '">' + value + '</option>');

							//LISTEN FOR CHANGES AND APPEND TO THE CELL						
							$(selectInput).on('change', function(e) {
								if (!this.value.length) api.column(colIdx).search(this.value).draw();
								else api.column(colIdx).search("^" + this.value + "$", true, false, true).draw();
							}).appendTo($(cell));                        
						}
					}

					filterRendered = true;
				}

				//HANDLE NUMERIC RANGE FILTERS
				else if (colInfo.sfRange == 'numeric') {
					var rangeName 		= colInfo.data;
					var dbField 		= colInfo.name;
					var rangeWrap 		= $('<div class="slick-filter-range-row"></div>').appendTo($(cell));
					var startRangeCol 	= $('<div class="slick-filter-range-col mb-1"></div>').appendTo($(rangeWrap));
					var endRangeCol 	= $('<div class="slick-filter-range-col"></div>').appendTo($(rangeWrap));


					if (typeof(options.serverSide) !== 'undefined' && options.serverSide == true) {
						var startRangeInput = $('<input type="number" step="any" class="form-control form-control-sm p-1" placeholder="From ' + title + '" id="' + rangeName + '-start">').on('keyup change search', function(e) {
							api.draw();
						}).appendTo($(startRangeCol));
						var endRangeInput = $('<input type="number" step="any" class="form-control form-control-sm p-1" placeholder="To ' + title + '" id="' + rangeName + '-end">').on('keyup change search', function(e) {
							api.draw();
						}).appendTo($(endRangeCol));

						ranges.push({
							col: colIdx,
							search: {
								data: colInfo.data,
								name: colInfo.name
							},
							start: $(startRangeInput),
							end: $(endRangeInput),
							type: 'numeric',
						});
					}
					else {
						var startRangeInput = $('<input type="search" class="form-control form-control-sm p-1" placeholder="From" id="' + rangeName + '-start">').on('keyup change search', function(e) {
							api.column(colIdx).search(this.value).draw();
						}).appendTo($(startRangeCol));
						var endRangeInput = $('<input type="search" class="form-control form-control-sm p-1" placeholder="To" id="' + rangeName + '-end">').on('keyup change search', function(e) {
							api.column(colIdx).search(this.value).draw();
						}).appendTo($(endRangeCol));


						$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
							var min 			= parseInt($(startRangeInput).val(), 10);
							var max 			= parseInt($(endRangeInput).val(), 10);
							var searchableCol 	= parseFloat(data[colIdx]) || 0; // use data for the age column

							if((isNaN(min) && isNaN(max)) || (isNaN(min) && searchableCol <= max) || (min <= searchableCol && isNaN(max)) || (min <= searchableCol && searchableCol <= max)) return true;
							return false;
						});
					}

					filterRendered = true;
				}

				//HANDLE DATE RANGE FILTERS
				else if (colInfo.sfRange == 'date') {

					var rangeName 		= colInfo.data;
					var dbField 		= colInfo.name;
					var rangeWrap 		= $('<div class="slick-filter-range-row"></div>').appendTo($(cell));
					var startRangeCol 	= $('<div class="slick-filter-range-col mb-1"></div>').appendTo($(rangeWrap));
					var endRangeCol 	= $('<div class="slick-filter-range-col"></div>').appendTo($(rangeWrap));

					var startRangeInput = $('<input type="date" class="form-control form-control-sm p-1" placeholder="From" id="' + rangeName + '-start">').on('keyup change search', function(e) { api.draw(); }).appendTo($(startRangeCol));
					var endRangeInput 	= $('<input type="date" class="form-control form-control-sm p-1" placeholder="To" id="' + rangeName + '-end">').on('keyup change search', function(e) { api.draw(); }).appendTo($(endRangeCol));


					//BUILD SERVERSIDE RANGE REQUEST
					if(typeof(options.serverSide) !== 'undefined' && options.serverSide == true){							

						//ADD TO THE RANGES
						ranges.push({
							col 		: colIdx,
							search 		: {
								data 	: colInfo.data,
								name 	: colInfo.name
							},
							start 		: $(startRangeInput),
							end 		: $(endRangeInput),
							type 		: 'date',
						});
					}

					//NOT SERVERSIDE REQUEST SO LETS BUILD A FILTER FOR EXISTING DATA
					else {

						//DYNAMICALLY ADD THE SEARCH FILTER FOR EXISTING ROWS
						$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {

							//VALIDATE DATES
							var min 			= $(startRangeInput).val().length == 10 ? new Date($(startRangeInput).val()+' 00:00:00') : null;
							var max 			= $(endRangeInput).val().length == 10 ? new Date($(endRangeInput).val()+' 23:59:59') : null ;
							var searchableCol 	= new Date(data[colIdx]);

							//FILTER BY THE MIN AND MAX DATE RANGE AND RETURN TRUE FOR VALID RECORDS
							if((min === null && max === null ) || (min === null && searchableCol <= max ) || (min <= searchableCol   && max === null ) || (min <= searchableCol   && searchableCol <= max )) return true;

							//RETURN FALSE FOR RECORDS THAT DONT MATCH THE DATE RANGE
							return false;
						});
					}

					filterRendered = true;
				}

				//HANDLE DATE FILTER
				else if (colInfo.sfFilter == 'date') {

					var startRangeInput = $('<input type="date" placeholder="' + title + '" class="form-control form-control-sm p-1"' + (!filterable ? "disabled" : '') + ' style="' + (!filterable ? "opacity:0; pointer-events: none;" : '') + '">').on('keyup change search', function(e) { api.draw(); }).appendTo($(cell));

					//BUILD SERVERSIDE RANGE REQUEST
					if(typeof(options.serverSide) !== 'undefined' && options.serverSide == true){							

						api.column(colIdx).search(this.value).draw();
					}

					//NOT SERVERSIDE REQUEST SO LETS BUILD A FILTER FOR EXISTING DATA
					else {

						//DYNAMICALLY ADD THE SEARCH FILTER FOR EXISTING ROWS
						$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {

							//VALIDATE DATES
							var min 			= $(startRangeInput).val().length == 10 ? new Date($(startRangeInput).val()+' 00:00:00') : null;
							var max 			= $(startRangeInput).val().length == 10 ? new Date($(startRangeInput).val()+' 23:59:59') : null ;
							var searchableCol 	= new Date(data[colIdx]);

							//FILTER BY THE MIN AND MAX DATE RANGE AND RETURN TRUE FOR VALID RECORDS
							if((min === null && max === null ) || (min === null && searchableCol <= max ) || (min <= searchableCol   && max === null ) || (min <= searchableCol   && searchableCol <= max )) return true;

							//RETURN FALSE FOR RECORDS THAT DONT MATCH THE DATE RANGE
							return false;
						});
					}

					filterRendered = true;
				}

				//HANDLE DATE FILTER
				else if (colInfo.sfFilter == 'numeric') {

					//BUILD THE DEFAULT INPUT FILTER
					$('<input type="number" step="any" placeholder="' + title + '" class="form-control form-control-sm p-1"' + (!filterable ? "disabled" : '') + ' style="' + (!filterable ? "opacity:0; pointer-events: none;" : '') + '">').on('keyup change search', function(e) {

						//ALLOW SEARCHING THIS COLUMN
						api.column(colIdx).search(this.value).draw();

					}).appendTo($(cell));

					filterRendered = true;
				}

				//HANDLE TEXT FILTER
				if (!filterRendered) {

					//BUILD THE DEFAULT INPUT FILTER
					$('<input type="search" placeholder="' + title + '" class="form-control form-control-sm p-1"' + (!filterable ? "disabled" : '') + ' style="' + (!filterable ? "opacity:0; pointer-events: none;" : '') + '">').on('keyup change search', function(e) {

						//ALLOW SEARCHING THIS COLUMN
						api.column(colIdx).search(this.value).draw();

					}).appendTo($(cell));
				}
			}
		});

		//HIDE THE RENDERED SLICK FILTERS
		$('.slick-datatable-filters', $(this)).css('opacity', '1');


		//CHECK IF SERVER SIDE
		if (typeof(options.serverSide) !== 'undefined' && options.serverSide == true) {

			//CHECK IF AJAX DATA IS A FUNCTION
			if (typeof(options.ajax.data) === 'function') {

				//CLONE THE DATA FUNCTION
				Function.prototype.cloneForSlickDataTableFilters = function() {
					var that = this;
					var temp = function temporary() {
						return that.apply(this, arguments);
					};
					for (var key in this)
						if (this.hasOwnProperty(key)) temp[key] = this[key];
					return temp;
				};

				//SET THE NEW DATA FUNCTION
				var newDataFunction = settings.ajax.data.cloneForSlickDataTableFilters();

				//OVERRIDE THE AJAX DATA FUNCTION
				settings.ajax.data = function(d) {
					if (ranges.length) {
						var tempRanges = {};
						for (var x = 0; x < ranges.length; x++) {
							tempRanges[ranges[x].col] = {
								search: ranges[x].search,
								start: $(ranges[x].start).val(),
								end: $(ranges[x].end).val(),
								type: ranges[x].type,
							};
						}
						d._ranges = tempRanges;
					}
					newDataFunction(d);
				}
			}
		}
	}).DataTable(options);
}
