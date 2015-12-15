/// <reference path="jquery-1.7.2.min.js" />
/// <reference path="jquery-ui-1.8.11.js" />
/// <reference path="editor.js" />
/// <reference path="jq.vb.plugins.js" />

EM_Graphs = (function () {
    var $chartTable,
        $chartMenu,
        $addChartBtn,
        $chartToEdit = false,
        isEditor = false;
       colorsArray = [];
    genericDataPatern = [{ title: 'ID', type: 'Number or Text' }, { title: 'Series', type: 'Number' }, { isRepeat: true }],
    ChartTypes = {
        bar: { name: 'bar', dataPattern: genericDataPatern },   //data-type , placeholder,
        pie: { name: 'pie', dataPattern: [{ title: 'ID', type: 'Number or Text' }, { title: 'Series', type: 'Positive Number' }] },
        doughnut: { name: 'doughnut', dataPattern: [{ title: 'ID', type: 'Number or Text' }, { title: 'Series', type: 'Positive Number' }] },
        area: { name: 'area', dataPattern: genericDataPatern },
        bubble: { name: 'bubble', dataPattern: [{ title: 'ID', type: 'Number or Text' }, { title: 'X', type: 'Number' }, { title: 'Y', type: 'Number' }, { title: 'Color', type: 'Number or Text' }, { title: 'Size', type: 'Number (optional)' }] },
        candlestick: { name: 'candlestick', dataPattern: [{ title: 'ID', type: 'Number or Text' } , { title: 'Low', type: 'Number' }, { title: 'Open', type: 'Number' }, { title: 'Close', type: 'Number' }, { title: 'High', type: 'Number' }] },  //check
        column: { name: 'column', dataPattern: genericDataPatern },
        sparkline: { name: 'sparkline', dataPattern: genericDataPatern }, // not is use
        combo: { name: 'combo', dataPattern: genericDataPatern }, // not in use
        line: { name: 'line', dataPattern: genericDataPatern },
        geochart: { name: 'geochart', dataPattern: [{ title: 'Country', type: 'Text' }, { title: 'Color', type: 'Number' }] },
        geochartMarkers: { name: 'geochartMarkers', dataPattern: [{ title: 'Address', type: 'Text' },  { title: 'Color', type: 'Number (optional)' }, { title: 'Size', type: 'Number (optional)' }] },
        treemap: { name: 'treemap', dataPattern: [{ title: 'ID', type: 'Text' }, { title: 'Parent ID', type: 'Text' }, { title: 'Size', type: 'Number (optional)' }, { title: 'Color', type: 'Number (optional)' }] },
        organizational: { name: 'organizational', dataPattern: [{ title: 'ID', type: 'Text' }, { title: 'Parent ID', type: 'Text' }, { title: 'Tag', type: 'Text (optional)' }] }, // not in use
        timeline: { name: 'timeline', dataPattern: [{ title: 'Row Label', type: 'Text' }, { title: 'Start', type: 'Date' }, { title: 'End', type: 'Date' }] },
        scatter: { name: 'scatter', dataPattern: [{ title: 'X', type: 'Number' }, { title: 'series Y', type: 'Number' }, { isRepeat: true }] },
        table: { name: 'table', dataPattern: [{ title: 'Header', type: 'Number or Text' }, { isRepeat: true }] }
    };
        
    ChartTypes.bar.helpLink = "https://support.google.com/drive/answer/190723?hl=en&ref_topic=30240";
    ChartTypes.pie.helpLink = "https://support.google.com/drive/answer/190726?hl=en&ref_topic=30240";
    ChartTypes.doughnut.helpLink = "https://support.google.com/drive/answer/190726?hl=en&ref_topic=30240";
    ChartTypes.area.helpLink = "https://support.google.com/drive/answer/190721?hl=en&ref_topic=30240";
    ChartTypes.bubble.helpLink = "https://developers.google.com/chart/interactive/docs/gallery/bubblechart";
    ChartTypes.candlestick.helpLink = "https://support.google.com/drive/answer/1409777?hl=en&ref_topic=30240";
    ChartTypes.column.helpLink = "https://support.google.com/drive/answer/190722?hl=en&ref_topic=30240";
    ChartTypes.line.helpLink = "https://support.google.com/drive/answer/190718?hl=en&ref_topic=30240";
    ChartTypes.geochart.helpLink = "https://support.google.com/drive/answer/1409802?hl=en&ref_topic=30240";
    ChartTypes.geochartMarkers.helpLink = "https://support.google.com/drive/answer/1409802?hl=en&ref_topic=30240";
    ChartTypes.organizational.helpLink = "https://support.google.com/drive/answer/190728?hl=en&ref_topic=30240";
    ChartTypes.timeline.helpLink = "https://developers.google.com/chart/interactive/docs/gallery/timeline";
    ChartTypes.scatter.helpLink = "https://support.google.com/drive/answer/190724?hl=en&ref_topic=30240";
    ChartTypes.table.helpLink = "https://support.google.com/drive/answer/1047438?hl=en&ref_topic=30240";

    ChartTypes.timeline.createDataTable = function (dataArr) { 
        var data = new google.visualization.DataTable(), headerRow;
        try {
            for (var i = 0; i < dataArr.length; i++) {
                if (dataArr[i][1]) {
                    dataArr[i][1] = new Date(dataArr[i][1]);
                }
                if (dataArr[i][2]) {
                    dataArr[i][2] = new Date(dataArr[i][2]);
                }
            }

            headerRow = dataArr.shift();
            data.addColumn('string', headerRow[0]);
            data.addColumn('date', headerRow[1]);
            data.addColumn('date', headerRow[2]);
            data.addRows(dataArr);
            return data;
        } catch (e) {
            console.log('unable to create data table from data array',dataArr, e);
            return e;
        }
    }

    //Column 0 - The node ID. It should be unique among all nodes, and can include any characters, including spaces. This is shown on the node. You can specify a formatted value to show on the chart instead, but the unformatted value is still used as the ID.
    //Column 1 - [optional] The ID of the parent node. This should be the unformatted value from column 0 of another row. Leave unspecified for a root node.
    //Column 2 - [optional] Tool-tip text to show, when a user hovers over this node.



    activeChartType = ChartTypes.column;

    function init() {
        
        if(EM_Editor){
            isEditor = true;

          
        }
        $chartTable = $('#chart-table');
        $chartMenu = $('#sd-chart');
        $addChartBtn = $('#add-chart-btn');

        attachEventHandlers();
    }

    function setSelectedChartType(ChartType, $chartType) {
        var chartName = ChartType ? ChartType.name : 'column',
            $ChartType = $chartType || $('#chart-type-' + chartName); //default to bar on error;

        activeChartType = ChartType || ChartTypes[$chartType.data('chart-type')];

        if (!$chartType.is('.selected')) {
            $('#chart-type-gallery').find('.selected').removeClass('selected');
            $chartType.addClass('selected');
            $chartMenu.addClass($chartType.attr('id'));
        }
        configureTableInputs();
    }

    function attachEventHandlers() {

        $('#mi-add-chart').on('sd-show', configureTableInputs);

        $('#chart-type-gallery').on('click', '.chart-type', function () {
            setSelectedChartType(null, $(this));
        });
        
        $chartTable.on('blur', 'input', function () {
            var $this = $(this),
                val = $this.val();
          
       
            validateCellValues(this);

        });
        

        $('#chart-code-txt').on('paste', function (e) {
            var data = EM_Workspace.getTextFromClipboard(e);
            setTimeout(function ($textarea, data) {
                var dataArr = dataArrayFromString(data, true),
                    $rows = dataArrayTotableRows(dataArr, 12);
                $chartTable.empty().append($rows);
                configureTableInputs();
                $textarea.val('');

            }, 100, $(this), data);
        });


        $addChartBtn.click(function () {
            var dataArr,
                chartType,
                isTable;

            validateCellValues($chartTable.find('input:selected'));
            if($chartMenu.is('.sd-invalid')){return;}

            if ($chartToEdit) {
                chartType = $('.selected.chart-type').data('chart-type');
                isTable = chartType === 'table';
                dataArr = tableRowsToDataArray($('#chart-table').find('tr'), isTable);
                editChart($chartToEdit, dataArr, chartType);
            } else {
                addChart();
            }
        });

        $("#add-row-btn").click(function () {
            var $lastRow = $('#chart-table').find('tr').last(),
                $clone = $lastRow.clone();
            $clone.find('input').val('');
            $lastRow.after($clone);
            configureTableInputs();
        });
        $("#delete-row-btn").click(function () {
            var $chartTable = $('#chart-table');
            if ($chartTable.find('tr').length > 11) {
                $chartTable.find('tr:last-child').remove();
                configureTableInputs();
            }

        });
        $("#add-column-btn").click(function () {
            addColumn();
            configureTableInputs();
        });
        $("#delete-column-btn").click(function () {
            var $chartTable = $('#chart-table');

            if ($chartTable.find('tr').first().children().length > 2) {
                $chartTable.find('td:last-child').remove();
                configureTableInputs();
            }

        });

    }

    function updateColorsArray(colorString) {

        try {
            colorString = colorString || EM_Menu.MenuStyles.classes['data-chart-colors'][0].cssRule.style['content'];

            if (colorString) {
                colorsArray = colorString.replace(/\s/g, '').replace('"', '').replace('"', '').replace("'", '').replace("'", '').split('|');  // removes quotes, white space and split at commas.
            } else {
                console.log('it appears that the graph colors are correctly defined in this theme. example of valid color config string: (.data-chart-colors {content: "#fff,#ggg"} ) ')
            }
            // colorString = EM_Menu.MenuStyles.classes['data-chart-colors'][0].cssRule.style['content'].replace('"', '').replace('"', '').replace("'", '').replace("'", '');
           // colorsArray = colorString.split(',');

          //   for (var i = 0; i < colorsArray.length; i++) {
          //      colorsArray[i] = colorsArray[i].trim();
          //  }

        }
         catch (e) {
             console.error(e);
        }
    }

    function showChartError(message) {
        var chartName = $('.chart-type.selected').attr('title');

        if (message.toLowerCase() === 'error') {
            message = '';  //prevent just the word 'error' from showing as the erorr message.
        }
        message += '<p class="em-dialog-minor-text"> Read more on <a class="sd-error-link" target="_blank" href="' + activeChartType.helpLink + '">google charts support.</a> </p>';

        if (isEditor) { //dialogTitle, dialogText, okFunc, okButtonText, cancelFunc, cancelButtonText, className
            EM_Dialog.show("Invalid Data for " + chartName + ' Chart',  message, null, "OK", null, "" ,'sd-chart-error');
        }
    }

    function widenLines($chart) {
        var $horzontalLines = $chart.find('rect[height="1"]').filter('[fill="#29473b"]').attr({ fill: '#7A7A7A', height: '3' });
        var $verticalLines = $chart.find('rect[width="1"]').filter('[fill="#29473b"]').attr({ fill: '#7A7A7A', width: '3' });

        var $bottomHorizontal = $horzontalLines.first();
        bottomY = Number($bottomHorizontal.attr('y'));
        $horzontalLines.each(function () {
            var $this = $(this);
            var y = Number($this.attr('y'));

            if (y > bottomY) {
                bottomY = y;
                $bottomHorizontal = $this;
            }
            console.log($this);
        });
        var $rightVertical = $verticalLines.first();
        rightX = Number($rightVertical.attr('x'));
        $verticalLines.each(function () {
            var $this = $(this);
            var x = Number($this.attr('x'));
            console.log($this);
            if (x > rightX) {
                rightX = x;
                $rightVertical = $this;
            }
        });
        $bottomHorizontal.attr('Y', bottomY - 3); //.attr('fill', 'red');
        $rightVertical.attr('x', rightX - 3);  //.attr('fill', 'red');
    }


    function drawChart(dataArr, $chart, chartType) {
        var data, options = {}, dataStr, $errors, themeIsDark = false;

        if (!dataArr || dataArr.length < 2) {
            showChartError('Not Enough Data');
            return false;
        }
        dataStr = dataArrayToString(dataArr);

        if (chartType !== ChartTypes.scatter.name) {
            //first row and first column are labels, so they must be string value type.
            // scatterchart can have numbers in first collumn
            stringifyColumn(dataArr, 0);
             stringfyFirstRow(dataArr);
        }
        $chart.attr('data-chart-type', chartType).data('chart-type', chartType);
        $chart.attr('data-chart-values', dataStr).data('chart-values', dataStr);

        try {
            themeIsDark = isEditor ? (EM_Menu.MenuStyles.classes['data-theme-is-dark'] !== undefined) : ($chart.attr('data-theme-is-dark') && $chart.attr('data-theme-is-dark') != 'false');
        $chart.attr('data-theme-is-dark', themeIsDark).data('theme-is-dark', themeIsDark);
        } catch (e) {
            console.error(e);
        }

        options.hAxis = {gridlines: { color: '#7A7A7A' } }; //7A7A7A
        options.vAxis = {gridlines: { color: '#7A7A7A' } };  // this color is used to locate the gridlines, in order to change their width

      //  options.hAxis = {  gridlines: { color: '#29473B' } }; //7A7A7A
      //  options.vAxis = { gridlines: { color: '#29473B' } };  // this color is used to locate the gridlines, in order to change their width


        if (themeIsDark) {
            options.legend = { textStyle: { color: 'white' } };  //  
            options.hAxis.textStyle = {color: 'white' }; 
            options.vAxis.textStyle = {color: 'white' };  
        }

        try {
            updateColorsArray(isEditor ? null : $chart.attr('data-colors'));
            if (colorsArray.length) {
                options.colors = colorsArray;  //TODO this is not efficient. shoudl store and update on every theme change
                $chart.attr('data-colors', colorsArray.join('|'));
            }
          
        }catch (e) {
            console.error(e);
        }
     
        options.backgroundColor = 'transparent';
        options.chartArea = { left: '8%', top: '8%', width: "70%", height: "70%" };
        options.fontSize = (1500 / ((window.outerWidth + window.outerHeight) / 2)) *  24;

        switch (chartType) {
            case ChartTypes.bar.name:
                options.vAxis = { baseline: 0 };
                options.chartArea.left = '12%';
                chart = new google.visualization.BarChart($chart[0]);
                break;
            case ChartTypes.pie.name:
                options.is3D = true;
                options.chartArea = { left: '5%', top: '5%', width: "95%", height: "95%" };
                chart = new google.visualization.PieChart($chart[0]);
                data = google.visualization.arrayToDataTable(dataArr);
                break;
            case ChartTypes.doughnut.name:
                options.chartArea = { left: '5%', top: '5%', width: "95%", height: "95%" };
                options.is3D = false;
                options.pieHole = 0.4;
                chart = new google.visualization.PieChart($chart[0]);
                data = google.visualization.arrayToDataTable(dataArr);
                break;
            case ChartTypes.area.name:
                options.vAxis = { baseline: 0 };
                chart = new google.visualization.AreaChart($chart[0]);
                break;
            case ChartTypes.bubble.name:
                //  options.tooltip = { textStyle: { fontSize: 34 } };
                options.sizeAxis = { maxSize: 100 };
                chart = new google.visualization.BubbleChart($chart[0]);
                break;
            case ChartTypes.candlestick.name:
                chart = new google.visualization.CandlestickChart($chart[0]);
                break;
            case ChartTypes.column.name:
                options.vAxis = { baseline: 0 };
                chart = new google.visualization.ColumnChart($chart[0]);
                break;
            case ChartTypes.sparkline.name:
                chart = new google.visualization.SparklineChart($chart[0]);
                break;
            case ChartTypes.combo.name:
                // Valid values are 'line', 'area', 'bars', 'candlesticks' and 'steppedArea'. 
                options.seriesType = 'Bars';
                options.series = { 0: { type: "bars" }, 1: { type: "line" }, 2: { type: "area" } };
                chart = new google.visualization.ComboChart($chart[0]);
                break;
            case ChartTypes.line.name:
                options.vAxis = { baseline: 0 };
                chart = new google.visualization.LineChart($chart[0]);
                break;
            case ChartTypes.geochart.name:
                options.tooltip = {textStyle : {fontSize : 32}};
                chart = new google.visualization.GeoChart($chart[0]); 
                break;
            case ChartTypes.geochartMarkers.name:
                options.displayMode = 'markers';
                options.tooltip = { textStyle: { fontSize: 32 } };
                chart = new google.visualization.GeoChart($chart[0]);
                break;
            case ChartTypes.treemap.name:
                stringifyColumn(dataArr, 1);
                chart = new google.visualization.TreeMap($chart[0]);
                break;
            case ChartTypes.organizational.name:
                stringifyAllColumns(dataArr);
                options.size = 'large';
                chart = new google.visualization.OrgChart($chart[0]);
                break;
            case ChartTypes.timeline.name:
                chart = new google.visualization.Timeline($chart[0]);
                data = ChartTypes.timeline.createDataTable(dataArr);

               // options.timeline = { rowLabelStyle: { fontSize: 24 }, barLabelStyle: { fontSize: 24 } };
              
                if (typeof data === typeof Error) {
                    showChartError('Invalid Data');
                    return false;
                }

                break;
            case ChartTypes.scatter.name:
                chart = new google.visualization.ScatterChart($chart[0]);
                break;
            case ChartTypes.table.name:
                stringifyAllColumns(dataArr);
                data = google.visualization.arrayToDataTable(dataArr);
                formatTable($chart, data, true);
                chart = new google.visualization.Table($chart[0]);
                break;
            default:
                chart = new google.visualization.BarChart($chart[0]);
                break;
        }
        if (!data) {
            try {
                data = google.visualization.arrayToDataTable(dataArr);
            } catch (e) {
                console.log(e);
                showChartError("ERROR");
                return false;
            }
        }
        //  if (activeChartType == ChartTypes.timeline) {
        //   data.setColumnProperty(1, 'type', 'date');
        //   data.setColumnProperty(2, 'type', 'date');
        // }

        chart.draw(data, options);

       // widenLines($chart);
       
        //Error Creating Chart	Please review your data
        $errors = $chart.find('[id*="google-visualization-errors-all"]');

        if ($errors.length) {
            
            showChartError($errors.text().slice(0, -1));
          
            console.log(dataArr, data, $errors.text().slice(0, -1));
            return false;
        }
        else {
            return true;
        }
    }

    function addChart() {
        var dataArr, $chart, chartType, isOk, isTable;

          chartType = $('.selected.chart-type').data('chart-type')
          isTable = chartType === 'table';
          dataArr = tableRowsToDataArray($chartTable.find('tr'), isTable),
          $chart = $('<div class="sd-element-chart" style="width:1400px; height:900px;">').appendTo('body');  //appending to make sure it has dimentions

        try {

            isOk = drawChart(dataArr, $chart, chartType);
            if (isOk !== false) {
                EM_Workspace.addElement($chart);
                EM_Editor.reportAnalytics('addChart');
                EM_Menu.deSelectDropdown();
            } else {
                $chart.remove();
              //error message is shown the draw chart function
            }
        }
        catch (e) {
            $chart.remove();
            showChartError('Error');

            console.log('chart exception', e);
        }
    }

    function copyChart($src, $target) {
        $target.html($src.html());
        $target.attr({ 'style': $src.attr('style'), 'data-chart-values': $src.attr('data-chart-values'), 'data-chart-type': $src.attr('data-chart-type') });
        $target.data({ 'chart-values': $src.data('chart-values'), 'chart-type': $src.data('chart-type') });
    }

    function editChart($chart, dataArr, chartType, dontRecordHistory) {
        var prevDataArr = dataArrayFromString($chart.data('chart-values')),
            prevChartType = $chart.data('chart-type'),
            $slideChart, isOk;

        isOk = drawChart(dataArr, $chart, chartType);

        if (isEditor) {
            $slideChart = $chart.closest('#edit-surface').length ? EM_Workspace.elementInSlide($chart) : false;

            if (isOk) {

                if ($slideChart) {
                    copyChart($chart, $slideChart);
                }
                if (!dontRecordHistory) {
                    EM_Editor.history.recordAction('edit-chart', { prevDataArr: prevDataArr, prevChartType: prevChartType, $chart: $chart, dataArr: dataArr, chartType: chartType });
                }
                if (isEditor) {
                    EM_Workspace.isDirty();
                    EM_Menu.setSavedStatus(false);
                    EM_Menu.deSelectDropdown();
                }
            } else {//revert. note - revert will nto work in player since it depends on the thumbnails- however- reverst is theoretically not needed in player where editing of data is not possible.
                copyChart($slideChart, $chart);
            }
        }
    }

    function redrawChartsInSlide($slide) {
        reloadChart($slide.children('.chart-wrapper').children('.sd-element-chart'));
    }

    function reloadChart($charts) {
        $charts.each(function () {
            var $chart = $(this);
            editChart($chart, dataArrayFromString($chart.data('chart-values')), $chart.data('chart-type'));
        });
    }

    function loadChartToTable() {
        var $chart = EM_Document.selected.$element,
            dataArr = dataArrayFromString($chart.data('chart-values')),
            chartType = $chart.data('chart-type'),
            $rows;

        setSelectedChartType(null, $('.chart-type').filter('[data-chart-type="' + chartType + '"]'));

        if (dataArr) {
            $rows = dataArrayTotableRows(dataArr, 11);

            $chartTable.empty().append($rows);
            $chartToEdit = $chart;
            console.log('adding sd-element chart to data of button');
            $addChartBtn.html('UPDATE');

            if (isEditor) {
                EM_Menu.showDropdown.apply($chartMenu.data().button.children('button.title')[0]);
            }
            $chartMenu.data().button.one('sd-hide', function () {
                $chartToEdit = false;
                console.log('removing sd-element chart from data of button!');
                $addChartBtn.html('ADD');
            });
        }
    }

    function addColumn() {
        $('#chart-table').find('tr').append('<td><input type="text"></td>');

    }

    function formatTable($chart, data, isStringify) {
        var formatter,
            columnCount = data.getNumberOfColumns(),
            i,
            j,
            sizeFactor,
            colunnFactor;

        if (isStringify) {
            for (i = 0; i < columnCount; i++) {
                data.setColumnProperty(i, 'type', 'string');
            }

        } else {
            formatter = new google.visualization.NumberFormat({ fractionDigits: 0 });
            var columnCount = data.getNumberOfColumns();
            for (j = 0; j < columnCount; j++) {
                formatter.format(data, j);
            }

        }
        sizeFactor = $chart.width() / 3 + $chart.height();
        colunnFactor = 1.5 * Math.max(6, columnCount);
        $chart.css('font-size', Math.ceil(sizeFactor / colunnFactor) + "px");
    }

    function configureTableInputs() {
        console.log('CONFIGURING TABLE INPUTS');
        var $rows = $chartTable.find('tr'),
            $headerRowCells = $rows.first().find('input'),
            $bodyRows = $rows.first().siblings(),
            dataPattern = activeChartType.dataPattern,
            dataUnitIndex = 0,
            columnCount = $headerRowCells.length,
            colNumber;

        for (columnCount; columnCount < dataPattern.length; columnCount++) {
            addColumn();
        }
        $headerRowCells.attr({ 'placeholder': '', 'title': '' });
        $bodyRows.find('input').removeClass('sd-input-numeric sd-input-numeric-invalid sd-input-numeric-positive');

        $headerRowCells.each(function (index) {
            var dataUnit = activeChartType.dataPattern[dataUnitIndex],
            $numericColumnCells = $();
            if (dataUnit && dataUnit.isRepeat) {
                dataUnitIndex--;
                dataUnit = dataPattern[dataUnitIndex];
            } else {
                dataUnitIndex++;
            }
            if (dataUnit) {
                $(this).attr({ 'placeholder': dataUnit.title, 'title': dataUnit.type });
                if (dataUnit.type === 'Number' || dataUnit.type === 'Positive Number') {
                    $numericColumnCells = $bodyRows.find('td:nth-child(' + (index + 1) + ')' + ' input');

                    $numericColumnCells.toggleClass('sd-input-numeric-positive', stringContains(dataUnit.type, 'positive'));

                    $numericColumnCells.addClass('sd-input-numeric');  
                }
            }
            validateCellValues($bodyRows.find('input'));
        });

    }

    function convertToDataType(cell) {
        var dt;
        if (cell) {
            return isNaN(cell) ? String(cell) : Number(cell);
        }
        return null;
    }

    function getLongestRowLength(array2d) {
        var length = 0;
        for (var i = 0; i < array2d.length; i++) {
            length = length < array[0].length ? array[0].length : length;
        }
        return length;
    }

    function flip2DArray(array2d) {
        var row = [], newArray = [],
        longestRow = getLongestRowLength(array);
        for (var i = 0; i < longestRow.length; i++) {
            for (var j = 0; j < array.length; j++) {
                row = array[j];
                if (row[i]) {

                }
            }
        }
      
    }

    function validateAllChartTypes(dataArr) {
       
        $('.chart-type').each(function () {
            var $this, chartType, isValid;
            $this = $(this);
            chartType =  ChartTypes[$this.data('chart-type')];

            isValid = validateDataArrValues(dataArr, chartType);

            $this.toggleClass('disabled', !isValid);

        });

    }

    function validateDataArrValues(dataArr, chartType) {
        var row, cell, dataType, isPositive;
        //TODO: need to flip the loop so it lopps down columns not across rows. 
        for (var i = 0; i < dataArr.length; i++) {
            row = dataArr[i];
            dataType = chartType.dataPattern[i] ? chartType.dataPattern[i].type : '';

            isPositive = dataType === 'Positive Number';
            if (dataType === 'Number' || isPositive) {
                for (var j = 0; j < row.length; j++) {
                    cell = row[j];
                    if (isNaN(cell)) {
                        return false;
                    } else if (isPositive & cell < 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function validateCellValues(selector) {
        var $cells = $(selector),
            $numericCells,
            hasError = false,
            $allRows = $chartTable.find('tr');

        $cells.removeClass('sd-input-numeric-invalid').attr('title', '');
        $numericCells = $cells.filter('.sd-input-numeric');
        $numericCells.each(function () {
            var $this = $(this),
                 val = $this.val();

            $this.val(stripInvalidChars(val));
            val = $this.val();

            if (val) {
                if (isNaN(val)) {
                    $this.addClass('sd-input-numeric-invalid').attr('title', 'must be a number');
                } else if ($this.is('.sd-input-numeric-positive') && Number(val) < 0) {
                    $this.addClass('sd-input-numeric-invalid').attr('title', 'must be a positive number');
                }
            }
        });
        hasError =  ($allRows.find('.sd-input-numeric-invalid').length > 0);
        if (hasError) {
            $('#chart-status').html("Data does not match the required data format");
        }
        $chartMenu.toggleClass('sd-invalid', hasError);
       // $addChartBtn.prop("disabled", hasError);
      
        // validateAllChartTypes(tableRowsToDataArray($('#chart-table tr'), true));
    }

    function removeNullColumns(dataArr, maxcolumns, includeHeader) {
        var hasData = false,
            colNum,
            rowNum,
            removeRowNum,
            data,
            rowCount = dataArr.length;
        try {
            maxcolumns = maxcolumns || dataArr[0].length;
           
            for (colNum = maxcolumns; colNum > -1; colNum--) {
                hasData = false;
                for (rowNum = includeHeader ? 0 : 1; rowNum < rowCount; rowNum++) {
                    data = dataArr[rowNum][colNum];
                    if (data) {
                        hasData = true;
                        rowNum = rowCount; // end the loop. for some reason it fails on break;
                    }
                }
                if (!hasData) {
                    for (removeRowNum = 0; removeRowNum < rowCount; removeRowNum++) {
                        dataArr[removeRowNum].splice(colNum, 1);
                    }
                }
            }
        } catch (e) {
            console.log('error in checking for nulls');
        }
        return dataArr;
        }

    function tableRowsToDataArray($tableRows, includeHeader) {
        var dataArr = [], innerArr, cellVal, nullColumnHeaders = [], $input;
        $tableRows.each(function (rowNumber) {
            innerArr = [];
            $(this).children().each(function (ColNumber) {
                $input =$(this).children('input');
                cellVal = ($input.val() || '').trim();

                if (rowNumber === 0 && !cellVal) {
                    cellVal = $input.attr('placeholder');
                } 
                innerArr.push(convertToDataType(cellVal));
               
            });
            if (innerArr.length && innerArr[0] !== null) {
                dataArr.push(innerArr);
            }
        });

        return removeNullColumns(dataArr, null, includeHeader);
    }

    function dataArrayToString(dataArr, isTabDelimited) {
        var rows = [],
             cellDelimiter = '(~c)',
            RowDelimiter = '(~r)';

        if (isTabDelimited) {
            cellDelimiter = "\t";
            RowDelimiter = "\n";
        }

        for (var i = 0; i < dataArr.length; i++) {
            rows.push(dataArr[i].join(cellDelimiter));
        }
        return rows.join(RowDelimiter);
    }

    function dataArrayFromString(data, isTabDelimited) {
        var array = [],
            innerArray = [], //corresponds to a row in the table
            cells,
            rows,
            cellVal,
            columnCount, // the column count of first row. all sucessive rows will receive null values or be trimmed to make them exactly this length in terms of cells;
            cellDelimiter = '(~c)',
            rowDelimiter = '(~r)';

        if (isTabDelimited) {
            cellDelimiter = "\t";
            rowDelimiter = "\n";
        }

        if (data) {
            rows = data.split(rowDelimiter);

            if (rows.length) {
                columnCount = rows[0].split(cellDelimiter).length;

                for (var i = 0; i < rows.length; i++) {
                    cells = rows[i].split(cellDelimiter);
                    innerArray = [];
                    for (var j = 0; j < columnCount; j++) {
                        cellVal = (cells[j] || '').trim(); // prevents zero values inc case of Number(' ') below. 
                        //innerArray.push(String(cell || ""));

                        if (cellVal) {
                            innerArray.push(isNaN(cellVal) ? cellVal : Number(cellVal));
                        } else {
                            innerArray.push('');
                        }
                    }
                    if (innerArray.length) {
                        array.push(innerArray);
                    }
                }

            } else {
                EM_Dialog.showError("Please paste table from spreadsheet.", "Invalid Data");
            }
            return array;
        }
    }
    function removeChars(str, chars) {
        var char;
        if (str) {

            for (var i = 0; i < chars.length; i++) {
                char = chars[i];

                while (str.indexOf(char) != -1) {
                    str = str.replace(char, '');
                }
            }
        }
        return str;
    }

    function stripInvalidChars(str) {
        return removeChars(str, '$%');  //remove dollar percent     tried to also do: euro nis yen pounds  but not working   //€₪¥£
    }

    function dataArrayTotableRows(data, minrows) {
        var $table = $('<table>'), $row, row, missingRowsCount;

        for (var i = 0; i < data.length; i++) {
            row = data[i];
            $row = $('<tr>');

            for (var j = 0; j < row.length; j++) {
                $('<td><input type="text" value="' + row[j] + '"></td>').appendTo($row);
            }
            $table.append($row);

        }
        missingRowsCount = minrows ? minrows - $table.children().length : 12;
        for (var i = 0; i < missingRowsCount; i++) {
            var $sampleRow = $row.clone();
            $sampleRow.find('input').val('');
            $table.append($sampleRow.clone());
        }
       
        return $table.children();
    }

    function stringifyAllColumns(dataArr) {
        var row, cell;
        for (var i = 0; i < dataArr.length; i++) {
            row = dataArr[i];
            for (var j = 0; j < row.length; j++) {
                cell = row[j];
                if (cell !== null && cell != undefined){
                    row[j] = String(cell);
            }
            }
        }
    }

    function stringfyFirstRow(dataArr) {
        var firstRow = dataArr[0];

        if(!firstRow){
            console.warn('invalid dataArr. expecting 2d array');
            return dataArr};

        for (var i = 0; i < firstRow.length; i++) {
            firstRow[i] = String(firstRow[i]);
        }
        return dataArr;

    }

    function stringifyColumn(dataArr, colNumber) {
        for (var i = 0; i < dataArr.length; i++) {

            var innerarr = dataArr[i], column = innerarr[colNumber];

            if (column) {
                dataArr[i][colNumber] = String(column);
            }
        }
        return dataArr;
    }

    function stringContains(string, substring, iscaseSensetive) {
        return (iscaseSensetive ? string : string.toLowerCase()).indexOf(substring) !== -1;
    }
    /* #endregion */

    return {
        init: init,
        addChart: addChart,
        loadChartToTable: loadChartToTable,
        dataArrayToString: dataArrayToString,
        reloadChart: reloadChart,
        editChart: editChart,
        redrawChartsInSlide: redrawChartsInSlide
    }
}());
