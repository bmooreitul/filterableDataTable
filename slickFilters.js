/*
	============================ EXAMPLE JAVASCRIPT =======================

	//USE .slickFilters INSTEAD OF .DataTable

	//RANGES ARE SET IN THE COLUMN DEFINITIONS
	//SINGLE SLICK FILTERS ARE SET IN THE COLUMN DEFINITIONS USING sfFilter

	//SUPPORTED COLUMN DEFINITIONS
	sfRange
		alias of "data-sf-range" 
		accepts: 
			- "date"
			- "numeric"
	sfFilter
		alias of "data-sf-filter"
		accepts: 
			- "date"
			- "numeric"
			- "select"

	sfSelectOptions 
		alias of "data-sf-select-options" 
		accepts: 
			- array of values, 
			- object of key value pairs

	DTInvoicesTable = $('#invoices-data-table').slickFilters({
		ajax: {
			url: "{{ route('admin-all-invoices.dt') }}",
			type: 'post',
			data: function (d) {
            	d.type 					= $("#filter-invoice-type").val();
            	d.corporationSearch 	= $('[name="corporationSearch"]').val();
            	d.invoiceSearch 		= $('[name="invoiceSearch"]').val();
            	d.invoiceSearchAmount 	= $('[name="invoiceSearchAmount"]').val();
            	d.startDate 			= $('[name="startDate"]').val();
            	d.endDate 				= $('[name="endDate"]').val();
            	d.dateType 				= $('[name="dateType"]').val();
            },
		},
		columns: [
			{data: 'doc_number'},
			{data: 'customer_name', name: 'invoices.customer_name'},
			{data: 'created_at', name: 'invoices.created_at', sfRange: 'date'},
			{data: 'invoice_due', name: 'invoices.invoice_due', sfFilter: 'date'},
			{data: 'sent_at', name: 'invoices.sent_at'},
			{data: 'amount', name: 'invoices.total_amount', sfRange: 'numeric'},
			{data: 'invoice_status', name: 'invoices.invoice_status'},
			{data: 'action', 'sortable': false},
		],
		order: [
			[2, 'desc']
		],
	})

	====================== HTML DATA ATTRIBUTE OPTIONS ================

	data-sf-range="{type}" type can be one of (date,numeric)
	data-sf-filter="{type}" type can be one of (date,numeric,select)
	data-sf-select-options="{options}" options can be a json object of associative key value pairs or an array of values

	============================ EXAMPLE HTML =======================

	//COLUMN DEFINITIONS CAN BE DEFINED USING A data-* ATTRIBUTE ON A HEADER COLUMN (SEE Invoice # COLUMN)

	<table class="table p-0 m-0" id="invoices-data-table">
		<thead>
			<th data-name="invoices.doc_number">Invoice #</th>
			<th>Corporation</th>
			<th>Created</th>
			<th>Due</th>
			<th>Sent</th>
			<th>Amount</th>
			<th>Status</th>
			<th data-filterable="false" data-sortable="false"></th>
		</thead>
	</table>


	======================== LARAVEL DATATABLES RANGE FILTERING ================

	$query = \App\Models\SomeModel::query();

	//CHECK FOR RANGE FILTERING
	if(is_array(request()->_ranges) && !empty(request()->_ranges)){

		//LOOP THROUGH RANGES
		foreach(request()->_ranges as $colKey => $rangeData){

			//CHECK FOR START RANGE
			if(isset($rangeData['start']) && strlen($rangeData['start'])){

				//NUMERIC RANGE
				if($rangeData['type'] == 'numeric') $query->where($rangeData['search']['name'], '>=', $rangeData['start']);

				//DATE RANGE
				elseif($rangeData['type'] == 'date') $query->where($rangeData['search']['name'], '>=', \Carbon\Carbon::parse($rangeData['start']));
			}

			//CHECK FOR END RANGE
			if(isset($rangeData['end']) && strlen($rangeData['end'])){

				//NUMERIC RANGE
				if($rangeData['type'] == 'numeric') $query->where($rangeData['search']['name'], '<=', $rangeData['end']);

				//DATE RANGE
				elseif($rangeData['type'] == 'date') $query->where($rangeData['search']['name'], '<=', \Carbon\Carbon::parse($rangeData['end']));
			}
		}
	}
*/



class slickFilterStorage {

	data;

	constructor(){
		this.data = (window.localStorage.getItem(window.location.href+'-slick-filter-storage') ? JSON.parse(window.localStorage.getItem(window.location.href+'-slick-filter-storage')) : {});
	}

	/*
	getDescendantProp = (obj, path) => (
	    path.split('.').reduce((acc, part) => acc && acc[part], obj)
	);
	*/

	add(key, val){
		this.data[key] = val;
		window.localStorage.setItem(window.location.href+'-slick-filter-storage', JSON.stringify(this.data));
	}


}

$.fn.slickFilters = function(options) {

	var thatTable = $(this);

	//DEFINE DEFAULTS
	var defaults = {
		slickFilter 	: true,
		processing 		: true,
		serverSide 		: true,
		autoWidth 		: false,
		orderCellsTop 	: true,
		stateSaveParams: function(settings, data) {
			data.filter_values = function(){
				var res = [];
				$.each($(thatTable).find('.slick-datatable-filters > th'), function(k, th){
					res[k] = [];
					$.each($(th).find(':input'), function(){
						res[k].push($(this).val());
					});
				});
				return res;
			}
		},
		language 		: {
			lengthMenu 	:
			'<span class="d-inline-block">Show&nbsp;</span> <select class="form-select d-inline-block my-0" style="width:100px;">' +
				'<option value="5">5</option>' +
				'<option value="10">10</option>' +
				'<option value="25">25</option>' +
				'<option value="50">50</option>' +
				'<option value="100">100</option>' +
			'</select>',
			sInfo: 'Showing _START_ to _END_ of _TOTAL_ Results',
		},
		dom: "<'row' <'col'>>t<'row p-3' <'col'i><'col text-end align-items-top'l><'col-auto'p>>",
	}

	//FORCE OPTIONS TO OBJECT
	if(typeof(options) !== 'object') options = {};

	//OVERRIDE SERVERSIDE
	if (typeof(options.ajax) === 'undefined') {
		defaults.serverSide = false;
		defaults.processing = false;
	}

	//BUILD THE OPTIONS
	var options = $.extend(true, defaults, options);

	//CHECK IF STATE SAVE IS ENABLED
	if(typeof(options.stateSave) !== 'undefined' && options.stateSave === true){

		//DEFINE THE DEFAULT INIT COMPLETE FUNCTION
		var defaultInitComplete = function(settings, json){

			console.log(settings);

			//SET STATE SAVED FILTER VALUES
	        if(typeof(settings.aoPreSearchCols) == 'object') for(var x in settings.aoPreSearchCols) if(typeof(settings.aoPreSearchCols[x].sSearch) != 'Undefined' && settings.aoPreSearchCols[x].sSearch.length){

	            //TRY TO FIND THE INPUT FOR THE FILTER COLUMN
	            var input = $(this).find('thead tr.slick-datatable-filters th:nth-child('+(Number(x)+1)+') > :input');

	            //IF THE INPUT EXISTS
	            if($(input).length){

	                //GET THE SAVED STATE VALUE
	                var val = settings.aoPreSearchCols[x].sSearch;

	                //PARSE THE SAVED STATE VALUE
	                if(settings.aoPreSearchCols[x].bRegex) val = val.substring(1, val.length-1);

	                //SET THE SAVED STATE VALUE
	                if(val.trim().length){
	                	$(input).val(val);
	                	$(input).closest('th').addClass('slick-filtered');
	                } 
	            }


	        }
		}


		//CHECK IF AN INIT COMPLETE FUNCTION WAS PASSED IN THE OPTIONS
		if(typeof(options.initComplete) == 'function'){

			//SET THE FUNCTION AS A VARIABLE
			var newInitComplete = options.initComplete;

			//REDEFINE THE FUNCTION
			options.initComplete = function(settings, json){

				//CALL THE DEFAULT INIT COMPLETE
				defaultInitComplete.call(this, settings, json);

				//CALL THE NEW INIT COMPLETE
				newInitComplete.call(this, settings, json);
			}		
		}

		//NO INIT COMPLETE FUNCTION WAS PASSED SO LETS USE THE DEFAULT
		else{
			options.initComplete = defaultInitComplete;
		}
	}	

	var defaultDrawCallback = function(settings, json){

		$(this).find('.slick-datatable-filters > th > :input').each(function(k, v){
			if($(this).val().length){
				$(this).closest('th').addClass('slick-filtered');
			}
			else{

				var remove = true;
				if($(this).closest('th :input').length > 1){
					$(this).closest('th :input').each(function(){
						if($(this).val().length) remove = false;
					});
				}

				if(remove) $(this).closest('th').removeClass('slick-filtered');
			}
		});
		//console.log('default draw callback');
	}

	if(typeof(options.fnDrawCallback) !== 'undefined' && typeof(options.fnDrawCallback) == 'function'){

		var newDataFunction = options.fnDrawCallback;

		options.fnDrawCallback = function(settings, json){
			defaultDrawCallback.call(this, settings, json);
			newDataFunction.call(this, settings, json);
		}
	}

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

		var setColInfo = false;

		//LOOP THROUGH THE FIRST ROW OF EACH COLUMN
		api.columns().eq(0).each(function(colIdx) {

			//GET THE TITLE AND CELL 
			var title = $('.slick-datatable-filters th', table).eq($(api.column(colIdx).header()).index()).text();
			var cell = $('.slick-datatable-filters th', table).eq($(api.column(colIdx).header()).index()).empty();

			$(cell).css('vertical-align', 'top');

			//FORMAT HTML5 DATA ATTRIBUTES
			[].forEach.call($(cell)[0].attributes, function(attr) {	

				var val = attr.value;
				try{
					var tempVal = $.parseJSON(val);
					val = tempVal;
				}
				catch{
					//SILENT
				}							

				if (/^data-/.test(attr.name)) $(cell).data(attr.name.substr(5).replace(/-(.)/g, function($0, $1) {
					return $1.toUpperCase();
				}), val);
			});

			//FLAG AS FILTERABLE OR NOT
			var filterable = $(cell).data('filterable') == false ? false : true;
			if($(cell).data('searchable') == false) filterable = false;

			//DEFAULT TO NO FILTER RENDERED
			var filterRendered = false;

			if(typeof(options.columns) == 'undefined'){
				setColInfo = true;
				options.columns = [];								
			}

			if(setColInfo) options.columns[colIdx] = $(cell).data();

			//IF FILTERABLE
			if(filterable){

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

								if($(this).val().length) $(this).closest('th').addClass('slick-filtered');
								else $(this).closest('th').removeClass('slick-filtered');
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
					
					var startRangeInput = $('<input type="number" step="any" class="form-control form-control-sm p-1" placeholder="From ' + title + '" id="' + rangeName + '-start">');

					//CHECK IF STATE SAVE IS ENABLED
					if(typeof(options.stateSave) !== 'undefined' && options.stateSave === true) if(checkStartVal = (new slickFilterStorage).data[$(table).attr('id')+'.'+colIdx+'.range.start']) $(startRangeInput).val(checkStartVal);

					var endRangeInput = $('<input type="number" step="any" class="form-control form-control-sm p-1" placeholder="To ' + title + '" id="' + rangeName + '-end">');

					//CHECK IF STATE SAVE IS ENABLED
					if(typeof(options.stateSave) !== 'undefined' && options.stateSave === true) if(checkEndVal = (new slickFilterStorage).data[$(table).attr('id')+'.'+colIdx+'.range.end']) $(endRangeInput).val(checkEndVal);					

					if(typeof(options.stateSave) !== 'undefined' && options.stateSave === true){

						startRangeInput.on('keyup change search', function(e) {
							(new slickFilterStorage).add($(this).closest('table').attr('id')+'.'+colIdx+'.range.start', $(this).val());
							api.draw(); 
						}).appendTo($(startRangeCol));

						endRangeInput.on('keyup change search', function(e) { 						
							(new slickFilterStorage).add($(this).closest('table').attr('id')+'.'+colIdx+'.range.end', $(this).val());
							api.draw(); 
						}).appendTo($(endRangeCol));
					}
					else{
						
						startRangeInput.on('keyup change search', function(e) { api.draw(); }).appendTo($(startRangeCol));
						endRangeInput.on('keyup change search', function(e) { api.draw(); }).appendTo($(endRangeCol));
					}

					if (typeof(options.serverSide) !== 'undefined' && options.serverSide == true) {										

						ranges.push({
							col 		: colIdx,
							search 		: {
								data 	: colInfo.data,
								name 	: colInfo.name
							},
							start 		: $(startRangeInput),
							end 		: $(endRangeInput),
							type 		: 'numeric',
						});
					}
					else {
						

						$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {

							//console.log(settings, data, dataIndex);
							var minVal = $(startRangeInput).val().trim();
							var maxVal = $(endRangeInput).val().trim();

							if(!minVal.length && !maxVal.length) return true;

							minVal = minVal.length ? parseFloat(minVal.replace(/[^\d.]+/g, "")) : parseInt(minVal);
							maxVal = maxVal.length ? parseFloat(maxVal.replace(/[^\d.]+/g, "")) : parseInt(maxVal);

							searchableCol = parseFloat((data[colIdx]+'').replace(/[^\d.]+/g, ""));

							if(isNaN(searchableCol)) return false;

							var min = minVal;
							var max = maxVal;

							//if(typeof(settings.aoStateSaveParams.ranges) == 'undefined') settings.aoStateSaveParams.ranges = {};
							//settings.aoStateSaveParams.ranges[colIdx] = {
							//	start: $(startRangeInput).val(),
							//	end: $(endRangeInput).val()
							//}

							//var t = $(settings.nTable);
							//console.log(t);

							//api.state.save();

							//var min 			= parseInt($(startRangeInput).val(), 10);
							//var max 			= parseInt($(endRangeInput).val(), 10);
							//var searchableCol 	= parseFloat(data[colIdx]) || 0; // use data for the age column

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

					var startRangeInput = $('<input type="date" class="form-control form-control-sm p-1" placeholder="From" data-bs-toggle="popover" data-bs-trigger="hover" data-bs-placement="left" data-bs-content="From" id="' + rangeName + '-start" onfocus="this.showPicker()">');

					//CHECK IF STATE SAVE IS ENABLED
					if(typeof(options.stateSave) !== 'undefined' && options.stateSave === true) if(checkStartVal = (new slickFilterStorage).data[$(table).attr('id')+'.'+colIdx+'.range.start']) $(startRangeInput).val(checkStartVal);

					//startRangeInput.on('keyup change search', function(e) { api.draw(); }).appendTo($(startRangeCol));

					var endRangeInput 	= $('<input type="date" class="form-control form-control-sm p-1" placeholder="To" data-bs-toggle="popover" data-bs-trigger="hover" data-bs-placement="left" data-bs-content="To" id="' + rangeName + '-end" onfocus="this.showPicker()">')

					//CHECK IF STATE SAVE IS ENABLED
					if(typeof(options.stateSave) !== 'undefined' && options.stateSave === true) if(checkEndVal = (new slickFilterStorage).data[$(table).attr('id')+'.'+colIdx+'.range.end']) $(endRangeInput).val(checkEndVal);	

					if(typeof(options.stateSave) !== 'undefined' && options.stateSave === true){

						startRangeInput.on('keyup change search', function(e) {
							(new slickFilterStorage).add($(this).closest('table').attr('id')+'.'+colIdx+'.range.start', $(this).val());
							api.draw(); 
						}).appendTo($(startRangeCol));

						endRangeInput.on('keyup change search', function(e) { 						
							(new slickFilterStorage).add($(this).closest('table').attr('id')+'.'+colIdx+'.range.end', $(this).val());
							api.draw(); 
						}).appendTo($(endRangeCol));
					}
					else{
						
						startRangeInput.on('keyup change search', function(e) { api.draw(); }).appendTo($(startRangeCol));
						endRangeInput.on('keyup change search', function(e) { api.draw(); }).appendTo($(endRangeCol));
					}

					//endRangeInput.on('keyup change search', function(e) { api.draw(); }).appendTo($(endRangeCol));


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
							if((min === null && max === null ) || (min === null && searchableCol <= max ) || (min <= searchableCol   && max === null ) || (min <= searchableCol && searchableCol <= max )) return true;

							//RETURN FALSE FOR RECORDS THAT DONT MATCH THE DATE RANGE
							return false;
						});
					}

					filterRendered = true;
				}

				//HANDLE DATE FILTER
				else if (colInfo.sfFilter == 'date') {

					if(typeof(options.serverSide) !== 'undefined' && options.serverSide == true){

						//BUILD THE DEFAULT INPUT FILTER
						$('<input type="date" onfocus="this.showPicker()" placeholder="' + title + '" class="form-control form-control-sm p-1"' + (!filterable ? "disabled" : '') + ' style="' + (!filterable ? "opacity:0; pointer-events: none;" : '') + '">').on('keyup change search', function(e) {

							try{
								api.column(colIdx).search(this.value).draw();
							}	
							catch{
								//SILENT
							}	

							//ALLOW SEARCHING THIS COLUMN
							//api.column(colIdx).search(this.value).draw();

						}).appendTo($(cell));
					}
					else{

						var startRangeInput = $('<input type="date" onfocus="this.showPicker()" placeholder="' + title + '" class="form-control form-control-sm p-1"' + (!filterable ? "disabled" : '') + ' style="' + (!filterable ? "opacity:0; pointer-events: none;" : '') + '">').on('keyup change search', function(e) { api.draw(); }).appendTo($(cell));

						//BUILD SERVERSIDE RANGE REQUEST
						if(typeof(options.serverSide) !== 'undefined' && options.serverSide == true){	

							try{
								api.column(colIdx).search(this.value).draw();
							}	
							catch{
								//SILENT
							}			

							
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
					}

					

					filterRendered = true;
				}

				//HANDLE DATE FILTER
				else if (colInfo.sfFilter == 'numeric') {

					//BUILD THE DEFAULT INPUT FILTER
					$('<input type="number" step="any" placeholder="' + title + '" class="form-control form-control-sm p-1"' + (!filterable ? "disabled" : '') + ' style="' + (!filterable ? "opacity:0; pointer-events: none;" : '') + '">').on('keyup change search', function(e) {

						try{
							api.column(colIdx).search(this.value).draw();
						}	
						catch{
							
						}	

						//ALLOW SEARCHING THIS COLUMN
						//api.column(colIdx).search(this.value).draw();

					}).appendTo($(cell));

					filterRendered = true;
				}

				//HANDLE TEXT FILTER
				if (!filterRendered) {

					//BUILD THE DEFAULT INPUT FILTER
					$('<input type="search" placeholder="' + title + '" class="form-control form-control-sm p-1"' + (!filterable ? "disabled" : '') + ' style="' + (!filterable ? "opacity:0; pointer-events: none;" : '') + '">').on('keyup change search', function(e) {

						try{
							api.column(colIdx).search(this.value).draw();
						}	
						catch{
							
						}	

						//ALLOW SEARCHING THIS COLUMN
						//api.column(colIdx).search(this.value).draw();

					}).appendTo($(cell));
				}
			}
		});

		//HIDE THE RENDERED SLICK FILTERS
		$('.slick-datatable-filters', $(this)).css('opacity', '1');


		//CHECK IF SERVER SIDE
		if(typeof(options.serverSide) !== 'undefined' && options.serverSide == true) {

			//CHECK IF AJAX DATA IS A FUNCTION
			if(typeof(options.ajax.data) === 'function'){

				//CLONE THE DATA FUNCTION
				Function.prototype.cloneForSlickDataTableFilters = function() {
					var that = this;
					var temp = function temporary() { return that.apply(this, arguments); };
					for(var key in this) if(this.hasOwnProperty(key)) temp[key] = this[key];
					return temp;
				};

				//SET THE NEW DATA FUNCTION
				var newDataFunction = settings.ajax.data.cloneForSlickDataTableFilters();

				//OVERRIDE THE AJAX DATA FUNCTION
				settings.ajax.data = function(d) {
					if(ranges.length) {
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
			else if(typeof(options.ajax.data) === 'undefined'){
				settings.ajax.data = function(d){
					if(ranges.length) {
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
				}
			}
		}

		
	}).DataTable(options);
}
