//TODO
// fix all CSS
// fix all JavaScript resizing
// get new data
// fix binary variables
// fix all the -20, and other hard coded values
// add mobile page teling you to go to desktop
// r -- first / dependent variables?
// add flacivon

var safari = navigator.userAgent.indexOf("Safari") > -1;

if (safari === true) {

    // change loader
    $(".loader").css("background", "#fdf6e3")

    // add error
    d3.select("body")
        .append("div")
        .html("Error: This interactive is not supported by Safari." + "<br/>" + "Please use another browser, such as Chrome or Firefox.")
        .attr("class", "error")

} else {

    /*------------------------------------
    LOADING SCREEN
    ------------------------------------*/

    var loadingLength = 1500;

    jQuery(document).ready(function($) {
        $(window).load(function() {
            setTimeout(function() {
                $('.loader').fadeOut('slow', function() {});
            }, loadingLength);
        });
    });

    /*------------------------------------
     PREPARING DATA
     ------------------------------------*/

    // data files
    var dictionary_data = "cjh12sep2016.csv", // main data
        badRegime = "badRegime.csv", // list of variables in bad regime model
        eliteThreat = "eliteThreat.csv", // list of variables in elite threat model
        randomForest = "randomForest.csv", // list of variables in random forest model
        secondChartData = "secondChartData.csv", // order and labels of second chart data
        firstChartData = "firstChartData.csv";

    // function to reorder data
    function reorderDict(object, orderedList) {

        tempDict = {};
        for (var i = 0; i < orderedList.length; i++) {
            var test = object[orderedList[i]];
            tempDict[orderedList[i]] = test;
        }
        return tempDict;
    }

    // function for processing data
    function truncateDecimals(number, digits) {

        var multiplier = Math.pow(10, digits),
            adjustedNum = number * multiplier,
            truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);

        return truncatedNum / multiplier;

    }

    var badRegimeIndex = [],
        eliteThreatIndex = [],
        randomForestIndex = [];

    // preparing data: locations
    var forecast = [], // ordered list
        forecastFull = [],
        varDict = {}, // dictionary
        varDictKeys = [],
        varDictChartOne = {},
        varDictFull = {};

    var reordered = [], // for second chart data
        labels = [], // for second chart labels
        ttipVar = [],
        ttipMetric = [],
        ttipDataSource = [];

    var varPers,
        varVals;

    /*------------------------------------
     SOME GENERAL SETTINGS
     ------------------------------------*/

    // selecting which and how many countries to initialize
    var numCountries = 20,
        countryStart = 0,
        countryEnd = countryStart + numCountries;

    // duration of main transition
    var durationMain = 1000,
        durationMini = 50;

    // general svg margins
    var margin = {
            top: 20,
            right: 10,
            bottom: 20,
            left: 10,
            ttip: 15
        },
        chartWidth,
        chartHeight;

    // bar attributes
    var bar = {
        padding: 0.1,
        clicked: null
    };

    var filled = "#586e75",
        unfilled = "#e8e1ce";

    /*------------------------------------
     SLIDER
     ------------------------------------*/

    var leftWidth = document.getElementById('titleLeft').getBoundingClientRect().width;
    var sliderHeight = 20;

    var slider = d3.select("#sliderWrapper")
        .append("svg")
        .attr("id", "slider")
        .attr("width", leftWidth / 2)
        .attr("height", sliderHeight);

    var dragging,
        sliderHandleRadius,
        sliderStart,
        sliderEnd,
        handleStart,
        handleEnd,
        sliderScale,
        sliderTrack,
        sliderHandle;

    /*------------------------------------
     CHART TWO BUTTONS
     ------------------------------------*/
    var containerWidth,
        rightWidth;

    containerWidth = $(".container").css("width").replace(/\D/g, '');
    rightWidth = containerWidth - leftWidth - 20; // 20 for padding

    var resizeSlider = d3.select("#resizeSliderWrapper")
        .append("svg")
        .attr("id", "resizeSlider")
        .attr("width", rightWidth / 2)
        .attr("height", sliderHeight);

    var resizeDragging,
        resizeUp,
        resizeDict = {},
        resizeSliderHandleRadius,
        resizeSliderStart,
        resizeSliderEnd,
        resizeHandleStart,
        resizeHandleEnd,
        resizeSliderScale,
        resizeSliderTrack,
        resizeSliderHandle;

    /*------------------------------------
     FIRST CHART HEADER
     ------------------------------------*/

    var headerOneWrapperDiv = document.getElementById("headerOneWrapper");

    var firstHeaderBorder = window.getComputedStyle(headerOneWrapperDiv, null)
        .getPropertyValue("border-left-width").replace(/\D/g, '') * 2;
    var firstHeaderPadding = window.getComputedStyle(headerOneWrapperDiv, null)
        .getPropertyValue("padding-left").replace(/\D/g, '') * 2;
    var firstHeaderMargins = (firstHeaderBorder) + (firstHeaderPadding);

    // set width of first header, based on size of title (for stylistic purposes)
    $(".headerOneWrapper").css("width", leftWidth - firstHeaderMargins);

    // reset size of sliders based on header size
    var rightPos = document.getElementById('headerOneWrapper').getBoundingClientRect().right;
    var sliderStartPos = document.getElementById('slider').getBoundingClientRect().left;
    var sliderLength = rightPos - sliderStartPos;

    // adjust sliders
    $('.sliderWrapper').css('width', sliderLength);
    d3.select("#slider").attr('width', sliderLength);

    $('#resizeSliderWrapper').css('width', sliderLength);
    d3.select('#resizeSlider').attr('width', sliderLength);

    /*------------------------------------
     SECOND CHART HEADER
     ------------------------------------*/

    var chartTwoWidth;

    var headerTwoWrapperDiv = document.getElementById("headerTwoWrapper");
    var secondHeaderBorder = window.getComputedStyle(headerTwoWrapperDiv, null)
        .getPropertyValue("border-left-width").replace(/\D/g, '') * 2;
    var secondHeaderPadding = window.getComputedStyle(headerTwoWrapperDiv, null)
        .getPropertyValue("padding-left").replace(/\D/g, '') * 2;
    var secondHeaderMargin = window.getComputedStyle(headerTwoWrapperDiv, null)
        .getPropertyValue("margin-left").replace(/\D/g, '');

    $(".headerTwoWrapper").css("width", rightWidth - secondHeaderBorder - secondHeaderPadding - secondHeaderMargin);

    function setSecondDimensions() {
        containerWidth = $(".container").css("width").replace(/\D/g, '');
        rightWidth = containerWidth - leftWidth - 20; // 20 for padding (change hard coding later)
        chartTwoWidth = rightWidth - chartLabelWidth - 20; // figure this hard coding out!
        $(".headerTwoWrapper").css("width", rightWidth - secondHeaderBorder - secondHeaderPadding - secondHeaderMargin);
        $(".chartTwo").css("width", rightWidth - 20);

    }

    /*------------------------------------
     SEARCH BAR
     ------------------------------------*/

    var titleHeight = $('#titlemain').height();
    var searchHeight = $('.searchBar').height();
    var searchPosDown = (titleHeight - searchHeight) / 2;

    $('.titleRight').css('padding-top', searchPosDown);
    var searchButtonPadding = parseInt($(".searchButton").css("paddingTop")) * 2;
    var searchButtonHeight = $(".searchButton").height();
    var searchBarBorder = parseInt($(".searchBar").css("border-top-width")) * 2;

    function resizeSearch() {
        var newWidth = document.getElementById('titleWrapper').getBoundingClientRect().width -
            document.getElementById('titleLeft').getBoundingClientRect().width -
            document.getElementById('searchButton').getBoundingClientRect().width;

        $('.searchBar').css("height", searchButtonHeight + searchButtonPadding - searchBarBorder);
        $('.searchBar').css("width", newWidth / 1.5);
    }

    resizeSearch();

    var options = [];

    /*------------------------------------
     BOTH CHART
     ------------------------------------*/

    var containerHeight = $(".container").css("height").replace(/\D/g, '');
    var titleWrapperHeight = $(".titleWrapper").css("height").replace(/\D/g, '');
    var sliderContainerHeight = $(".sliderContainer").css("height").replace(/\D/g, '');
    var headerWrapperHeight = $(".headerWrapper").css("height").replace(/\D/g, '');

    var bothChartVertical = containerHeight - $('.chartOne').position().top;

    // magnitude for sizing charts
    var startMagnitude = 100;
    var endMagnitude = (containerHeight / bothChartVertical) * 100;
    var selectedMagnitude = startMagnitude;

    var bothChartHeight = bothChartVertical * (selectedMagnitude / 100);
    var bothChartPadding = 5;

    var chartLabelWidth = leftWidth * (1 / 4);

    /*------------------------------------
     FIRST CHART
     ------------------------------------*/

    var chartOneWidth = leftWidth - chartLabelWidth;

    var first_xScale = d3.scaleLinear(),
        first_yScale = d3.scaleBand()
        .padding(bar.padding);

    function setFirstScales(w, h) {

        first_xScale.range([0, w]);
        first_yScale.range([0, h]);

    }

    setFirstScales(chartOneWidth, bothChartHeight);

    $(".chartOne").css("width", leftWidth);

    var chartOne = d3.select("#chartOne")
        .append("svg")
        .attr("width", chartOneWidth + chartLabelWidth + bothChartPadding)
        .attr("height", bothChartHeight + 20) // 20 is for axes...?
        .attr("id", "chartOneSvg")
        .append("g")
        .attr("class", "chartOne")
        .attr("id", "chartOne");

    var first_xAxis = d3.axisBottom()
        .scale(first_xScale)
        .ticks(6)
        .tickFormat(d3.format(".1%"));

    chartOne.append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(" + chartLabelWidth + "," + bothChartHeight + ")");

    /*------------------------------------
     SECOND CHART
     ------------------------------------*/

    var second_xScale = d3.scaleLinear(),
        second_yScale = d3.scaleBand()
        .padding(bar.padding);

    function setSecondScales(w, h) {

        second_xScale.range([0, w]);
        second_yScale.range([0, h]);

    }

    chartTwoWidth = rightWidth - chartLabelWidth - 20;

    setSecondScales(chartTwoWidth, bothChartHeight);

    $(".chartTwo").css("width", rightWidth - 20);

    var chartTwo = d3.select("#chartTwo")
        .append("svg")
        .attr("width", chartTwoWidth + chartLabelWidth + bothChartPadding)
        .attr("height", bothChartHeight + 20) // 20 is for axes...?
        .attr("id", "chartTwoSvg")
        .append("g")
        .attr("class", "chartTwo")
        .attr("id", "chartTwo");

    var second_xAxis = d3.axisBottom()
        .scale(second_xScale)
        .ticks(6)
        .tickFormat(function(d) {
            return d + "%"
        });

    chartTwo.append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(" + chartLabelWidth + "," + bothChartHeight + ")");

    /*------------------------------------
     TOOLTIPS
     ------------------------------------*/

    var sliderTtip = d3.select("#sliderTtip");

    $('.sliderTtipContainer').css('width', leftWidth);
    var sampleButtonWidth = parseInt($('#buttonText').css('width')) + parseInt($('#buttonButtonContainer').css('width'));

    $('.buttonTextContainer').css('width', sampleButtonWidth * 1.1);

    var totalHeight = parseInt($('.buttonTextContainer').css('height'));
    var thisHeight = parseInt($('.buttonText').css('height'));
    var heightDiff = totalHeight - thisHeight;
    $('.buttonText').css('top', heightDiff / 2);

    var ttip = d3.select("body")
        .append("div")
        .attr("class", "ttip");

    var ttipChartOne = d3.select("body")
        .append("div")
        .attr("class", "ttip");

    /*------------------------------------
     EXTRA VARS TO USE + CLEAN
     ------------------------------------*/

    // eight step color scale
    var step = d3.scaleLinear()
        .domain([0, 10])
        .range([0, 1]);

    var brewerColors = [
        "#a50026", "#d73027",
        "#f46d43", "#fdae61",
        "#fee08b", "#ffffbf",
        "#d9ef8b", "#a6d96a",
        "#66bd63", "#1a9850",
        "#006837"
    ].reverse()

    var colors = d3.scaleLinear()
        .domain([0, step(1), step(2), step(3), step(4), step(5), step(6), step(7), step(8), step(9), 10])
        .range(brewerColors);

    var thresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
        color_intervals = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95];

    var shades = color_intervals.map(function(t) {
        return colors(t);
    });

    var colorScale = d3.scaleThreshold()
        .domain(thresholds)
        .range(shades);

    // format decimal
    var formatDecimal = d3.format(",.1%");

    // button selected
    var selectedButton = "allIndex",
        buttonArray = [];

    /*------------------------------------
     USING DATA
     ------------------------------------*/

    d3.queue()
        .defer(d3.csv, dictionary_data)
        .defer(d3.csv, firstChartData)
        .defer(d3.csv, secondChartData)
        .defer(d3.csv, badRegime)
        .defer(d3.csv, eliteThreat)
        .defer(d3.csv, randomForest)
        .await(function(error, dictionary_data, firstChartData, secondChartData, badRegime, eliteThreat, randomForest) {

            if (error) {

                console.error(error);

            } else {

                for (var i = 0; i < secondChartData["columns"].length; i += 5) {
                    reordered.push(secondChartData["columns"][i]);
                    labels.push(secondChartData["columns"][i + 1]);
                    ttipVar.push(secondChartData["columns"][i + 2]);
                    ttipMetric.push(secondChartData["columns"][i + 3]);
                    ttipDataSource.push(secondChartData["columns"][i + 4]);
                }

                for (var i = 0; i < dictionary_data.length; i++) {

                    var newCountry = Object();
                    for (prop in dictionary_data[i]) {

                        // changes variable names to workable format
                        var newProp = prop.replace(/\./g, "_");
                        newCountry[newProp] = dictionary_data[i][prop];

                        // converts quantitative variables to numbers
                        if (prop !== "sftgcode" && prop !== "country") {
                            newCountry[newProp] = Number(newCountry[newProp]);
                        }
                    }

                    reorderedNewCountry = reorderDict(newCountry, reordered);

                    // pushing data to relevant locations
                    forecastFull.push(newCountry);
                    varDictFull[dictionary_data[i].country] = reorderedNewCountry;
                    varDictKeys.push(dictionary_data[i].country);
                    options.push(dictionary_data[i].country); // for resizing text
                }

                // console.log(varDictChartOne);
                for (mod in varDictFull[forecastFull[0].country]) {

                    // check if variable is relevant
                    if ((mod.slice(0, 6) !== "postcw") &&
                        (mod.slice(mod.length - 3, mod.length)) === "PER") {

                        // temporary variables for holding variables' data
                        var tempVal;
                        var tempList = [];

                        // recording variables' data
                        for (country in varDictFull) {
                            tempVal = varDictFull[country][mod];

                            if (tempList.indexOf(tempVal) === -1) {
                                tempList.push(tempVal)
                            }
                        }

                        // checking if variable is binary
                        if (tempList.length === 2) {

                            // changing percentile rankings of binary variables with values of 0
                            for (country in varDictFull) {
                                if (varDictFull[country][mod] === 0) {
                                    var max = Math.max.apply(null, tempList);
                                    varDictFull[country][mod] = (1 - max);
                                }
                            }

                            // changing values of binary variables to strings for ttip
                            for (var i = 0; i < forecastFull.length; i++) {
                                if (forecastFull[i][mod.slice(0, -3)] === 0) {
                                    forecastFull[i][mod.slice(0, -3)] = "No";
                                } else if (forecastFull[i][mod.slice(0, -3)] === 1) {
                                    forecastFull[i][mod.slice(0, -3)] = "Yes";
                                }
                            }
                        }
                    }
                }

                function subsetData(startCountryIndex, endCountryIndex) {

                    // clear existing data
                    forecast = [];
                    varDict = {};

                    // subset forecasting data
                    forecast = forecastFull.slice(startCountryIndex, endCountryIndex);

                    // subset dictionary data
                    var countries = varDictKeys.slice(startCountryIndex, endCountryIndex);
                    for (var i = 0; i < countries.length; i++) {
                        varDict[countries[i]] = varDictFull[countries[i]];
                    }
                }

                function findIndex(csvFile, list) {
                    for (var i = 0; i < csvFile["columns"].length; i++) {
                        var temp = csvFile["columns"][i].replace(/\./g, "_");
                        for (var n = 0; n < reordered.length; n++) {
                            if (reordered[n].search(temp) !== -1) {
                                list.push(n)
                            }
                        }
                    }
                }

                findIndex(badRegime, badRegimeIndex);
                findIndex(eliteThreat, eliteThreatIndex);
                findIndex(randomForest, randomForestIndex);

                function drawSlider(data) {

                    /*------------------------------------
                     FIRST SLIDER
                     ------------------------------------*/

                    dragging = false;

                    sliderHandleRadius = (document.getElementById('slider').getBoundingClientRect().height) / 2;

                    // change width and positioning of slider wrapper
                    $('.sliderWrapper').css("width", (document.getElementById('slider').getBoundingClientRect().width * 1) +
                        (2 * sliderHandleRadius));
                    $('.sliderWrapper').css({
                        "-webkit-transform": function() {
                            return "translate(" + (-sliderHandleRadius) + "px,0)";
                        }
                    });

                    d3.select("#slider")
                        .attr("width", document.getElementById('sliderWrapper').getBoundingClientRect().width);

                    sliderStart = 0;
                    sliderEnd = sliderStart + document.getElementById('slider').getBoundingClientRect().width;

                    handleStart = sliderStart + sliderHandleRadius;
                    handleEnd = sliderEnd - sliderHandleRadius;

                    sliderScale = d3.scaleLinear()
                        .rangeRound([0, data.length - numCountries])
                        .domain([handleStart, handleEnd]);

                    sliderTrack = d3.select("#slider")
                        .append("rect")
                        .attr("id", "sliderTrack")
                        .attr("width", function() {
                            return document.getElementById("slider").getBoundingClientRect().width -
                                (sliderHandleRadius * 2);
                        })
                        .attr("height", "25%")
                        .attr("x", sliderHandleRadius)
                        .attr("y", "37.5%")
                        .attr("fill", "#586e75");

                    sliderHandle = d3.select("#slider")
                        .append("circle")
                        .attr("id", "sliderHandle")
                        .attr("cursor", "ew-resize")
                        .attr("cx", function() {
                            return handleStart;
                        })
                        .attr("cy", "50%")
                        .attr("r", sliderHandleRadius)
                        .attr("fill", "#586e75")
                        .call(d3.drag()
                            .on("drag", dragged)
                            .on("end", function() {
                                dragging = false;
                            }));

                    /*------------------------------------
                     RESIZE SLIDER
                     ------------------------------------*/

                    resizeDragging = false;

                    resizeSliderHandleRadius = (document.getElementById('resizeSlider').getBoundingClientRect().height) / 2;

                    // change width and positioning of slider wrapper
                    $('#resizeSliderWrapper').css("width", (document.getElementById('resizeSlider').getBoundingClientRect().width) +
                        (2 * resizeSliderHandleRadius) - 20); // 20 for padding
                    $('#resizeSliderWrapper').css({
                        "-webkit-transform": function() {
                            return "translate(" + (-resizeSliderHandleRadius) + "px,0)";
                        }
                    });

                    d3.select("#resizeSlider")
                        .attr("width", document.getElementById('resizeSliderWrapper').getBoundingClientRect().width);

                    resizeSliderStart = 0;
                    resizeSliderEnd = resizeSliderStart + document.getElementById('resizeSlider').getBoundingClientRect().width;

                    resizeHandleStart = resizeSliderStart + resizeSliderHandleRadius;
                    resizeHandleEnd = resizeSliderEnd - resizeSliderHandleRadius;

                    resizeSliderScale = d3.scaleLinear()
                        .rangeRound([startMagnitude, endMagnitude])
                        .domain([resizeHandleStart, resizeHandleEnd]);

                    resizeSliderTrack = d3.select("#resizeSlider")
                        .append("rect")
                        .attr("id", "resizeSliderTrack")
                        .attr("width", function() {
                            return document.getElementById("resizeSlider").getBoundingClientRect().width -
                                (resizeSliderHandleRadius * 2);
                        })
                        .attr("height", "25%")
                        .attr("x", resizeSliderHandleRadius)
                        .attr("y", "37.5%")
                        .attr("fill", "#586e75");

                    resizeSliderHandle = d3.select("#resizeSlider")
                        .append("circle")
                        .attr("id", "resizeSliderHandle")
                        .attr("cursor", "ew-resize")
                        .attr("cx", function() {
                            return resizeHandleStart;
                        })
                        .attr("cy", "50%")
                        .attr("r", resizeSliderHandleRadius)
                        .attr("fill", "#586e75")
                        .call(d3.drag()
                            .on("drag", resizeDragged)
                            .on("end", function() {
                                resizeDragging = false;
                            }));
                }

                function drawSliderTtip(countryStart, countryEnd) {

                    sliderTtip
                        .html(countryStart + " to " + countryEnd)

                    // record positioning of slider handle
                    var sliderPos = document.getElementById('sliderWrapper').getBoundingClientRect();

                    // width and height of slider
                    var sliderTtipHeight = document.getElementById('sliderTtip').getBoundingClientRect().height,
                        sliderTtipWidth = document.getElementById('sliderTtip').getBoundingClientRect().width;

                    // positioning slider
                    var handlePos = document.getElementById('sliderHandle').getBoundingClientRect().left +
                        (document.getElementById('sliderHandle').getBoundingClientRect().width / 2);

                    var leftLimit = document.getElementById('sliderWrapper').getBoundingClientRect().left +
                        (sliderTtipWidth / 2),
                        rightLimit = document.getElementById('sliderWrapper').getBoundingClientRect().right -
                        (sliderTtipWidth / 2),
                        sliderTtipPos = document.getElementById('sliderTtip').getBoundingClientRect().left;

                    if (handlePos >= leftLimit && handlePos <= rightLimit) {
                        sliderTtip.style("left", handlePos - sliderTtipWidth + "px");
                    } else if (handlePos <= leftLimit) {
                        sliderTtip.style("left", sliderPos.left - (sliderTtipWidth / 2) + "px");
                    } else if (handlePos >= rightLimit) {
                        sliderTtip.style("right", sliderPos.right + "px")
                    }

                }

                function dragged() {

                    dragging = true;

                    d3.select(this).attr("cx", function() {

                        if (d3.event.x + sliderHandleRadius >= sliderEnd) {
                            return sliderEnd - sliderHandleRadius;
                        } else if (d3.event.x - sliderHandleRadius <= sliderStart) {
                            return sliderStart + sliderHandleRadius;
                        }

                        return d3.event.x + (sliderHandleRadius / 2);

                    });

                    var handlePos = document.getElementById('sliderHandle')
                        .getAttribute('cx');

                    countryStart = sliderScale(handlePos);
                    countryEnd = sliderScale(handlePos) + numCountries;

                    drawFirstChart(countryStart, countryEnd, durationMini, selectedMagnitude);
                    drawSliderTtip(countryStart, countryEnd);


                }

                function resizeDragged() {

                    resizeDragging = true;

                    var currentPos = d3.select(this).attr('cx');

                    d3.select(this).attr('cx', function() {

                        resizeDragging = true;

                        if (d3.event.x + resizeSliderHandleRadius >= resizeSliderEnd) {
                            return resizeSliderEnd - resizeSliderHandleRadius;
                        } else if (d3.event.x - resizeSliderHandleRadius <= resizeSliderStart) {
                            return resizeSliderStart + resizeSliderHandleRadius;
                        }

                        return d3.event.x;

                    })

                    var newPos = d3.select(this).attr('cx');

                    if (newPos > currentPos) {
                        resizeUp = true;
                    } else if (newPos < currentPos) {
                        resizeUp = false;
                    }

                    var resizeHandlePos = document.getElementById('resizeSliderHandle').getAttribute('cx');

                    selectedMagnitude = resizeSliderScale(resizeHandlePos);
                    drawFirstChart(countryStart, countryEnd, durationMini, selectedMagnitude)
                    drawSecondChart(selectedMagnitude);
                }

                drawSlider(dictionary_data);
                drawSliderTtip(countryStart, countryEnd);

                var currentCountry = forecastFull[0].country;

                function pushVariableData(country) {

                    varPers = []; // percentage rankings of variables
                    varVals = []; // values of variables

                    // record percentile ranking of each variable
                    for (mod in varDictFull[country]) {
                        varPers.push(truncateDecimals(varDictFull[country][mod] * 100, 1));
                    }

                    // record value of each variable
                    for (var i = 0; i < forecastFull.length; i++) {
                        if (forecastFull[i]["country"] === country) {
                            for (mod in varDictFull[country]) {
                                varVals.push(forecastFull[i][mod.slice(0, -3)]);
                            }
                        }
                    }

                }

                pushVariableData(currentCountry);

                /*------------------------------------
                 S: DRAW FIRST CHART
                 ------------------------------------*/

                function drawFirstChart(countryStart, countryEnd, duration, magnitude) {

                    bothChartHeight = bothChartVertical * (magnitude / 100);
                    $(".chartOne").css("height", bothChartHeight);
                    d3.select("#chartOneSvg").attr("height", bothChartHeight + 20)

                    setFirstScales(chartOneWidth, bothChartHeight);

                    subsetData(countryStart, countryEnd);

                    // scale range of data in the domain of first chart
                    first_xScale.domain([0, d3.max(forecast, function(d) {
                        return d.mean_p;
                    })]);
                    first_yScale.domain(forecast.map(function(d) {
                        return d.country;
                    }));

                    // join data
                    var bar = chartOne.selectAll(".bar")
                        .data(forecast);

                    var labelBar = chartOne.selectAll(".labelBar")
                        .data(forecast);

                    var label = chartOne.selectAll(".label")
                        .data(forecast);

                    // update
                    bar
                        .attr("x", chartLabelWidth)
                        .attr("y", function(d) {
                            return first_yScale(d.country)
                        })
                        .attr("height", first_yScale.bandwidth())
                        .attr("fill", function(d) {
                            if (d.country === currentCountry) {
                                return filled; // first country loaded
                            } else {
                                return unfilled;
                            }
                        })
                        .transition()
                        .duration(duration)
                        .attr("width", function(d) {
                            return first_xScale(d.mean_p);
                        });

                    labelBar
                        .attr("x", 0)
                        .attr("y", function(d) {
                            return first_yScale(d.country)
                        })
                        .attr("height", first_yScale.bandwidth())
                        .attr("fill", unfilled)
                        .attr("width", chartLabelWidth - bothChartPadding);

                    label
                        .text(function(d) {
                            return d.country;
                        })
                        .attr("font-size", function() {
                            return 9;
                        })
                        .attr("x", function() {
                            var barLength = chartLabelWidth - 5;
                            var textLength = this.getComputedTextLength();
                            return (barLength - textLength) / 2;
                        })
                        .attr("y", function(d) {
                            return first_yScale(d.country) + (first_yScale.bandwidth() / 1.5);
                        });

                    // enter
                    bar
                        .enter()
                        .append("rect")
                        .attr("class", "bar")
                        .attr("fill", function(d) {
                            if (d.country === currentCountry) {
                                return filled; // first country loaded
                            } else {
                                return unfilled;
                            }
                        })
                        .attr("stroke", "#586e75")
                        .attr("stroke-opacity", 0)
                        .attr("stroke-width", 4)
                        .attr("x", chartLabelWidth)
                        .attr("y", function(d) {
                            return first_yScale(d.country)
                        })
                        .attr("height", first_yScale.bandwidth())
                        .attr("width", function(d) {
                            return first_xScale(d.mean_p);
                        });

                    labelBar
                        .enter()
                        .append("rect")
                        .attr("class", "labelBar")
                        .attr("fill", unfilled)
                        .attr("x", 0)
                        .attr("y", function(d) {
                            return first_yScale(d.country)
                        })
                        .attr("height", first_yScale.bandwidth())
                        .attr("width", chartLabelWidth - bothChartPadding);

                    label
                        .enter()
                        .append("text")
                        .attr("class", "label")
                        .text(function(d) {
                            return d.country;
                        })
                        .attr("fill", "#586e75")
                        .attr("font-size", function() {
                            return 9;
                        })
                        .attr("x", function() {
                            var barLength = chartLabelWidth - 5;
                            var textLength = this.getComputedTextLength();
                            return (barLength - textLength) / 2;
                        })
                        .attr("y", function(d) {
                            return first_yScale(d.country) + (first_yScale.bandwidth() / 1.5);
                        });

                    //    bar.remove().exit();
                    //    labelBar.remove().exit();
                    //    label.remove().exit();

                    chartOne.select(".xAxis")
                        .call(first_xAxis)
                        .attr("transform", "translate(" + chartLabelWidth + "," + bothChartHeight + ")");

                }

                /*------------------------------------
                 S: DRAW SECOND CHART
                 ------------------------------------*/

                function drawSecondChart(magnitude) {

                    bothChartHeight = bothChartVertical * (magnitude / 100);
                    $(".chartTwo").css("height", bothChartHeight);
                    d3.select("#chartTwoSvg").attr("height", bothChartHeight + 20)

                    setSecondScales(chartTwoWidth, bothChartHeight);

                    // scale range of data in the domain of second chart
                    second_xScale.domain([0, 100]);
                    second_yScale.domain(labels.map(function(d) {
                        return d;
                    }));

                    // join data
                    var barTransparent = chartTwo.selectAll(".barTransparent")
                        .data(varPers);

                    var barTwo = chartTwo.selectAll(".barTwo")
                        .data(varPers);

                    var labelTwo = chartTwo.selectAll(".labelTwo")
                        .data(labels);

                    var labelBarTwo = chartTwo.selectAll(".labelBarTwo")
                        .data(varPers);

                    // update
                    barTransparent
                        .attr("x", chartLabelWidth)
                        .attr("y", function(d, i) {
                            var numBars = varPers.length;
                            return i * bothChartHeight / numBars;
                        })
                        .attr("height", second_yScale.bandwidth())
                        .attr("width", second_xScale(100));

                    barTwo
                        .attr("x", chartLabelWidth)
                        .attr("y", function(d, i) {
                            var numBars = varPers.length;
                            return i * bothChartHeight / numBars;
                        })
                        .attr("height", second_yScale.bandwidth())
                        .transition()
                        .duration(durationMain)
                        .attr("fill", function(d, i) {
                            if (selectedButton === "allIndex" || buttonArray.includes(i)) {
                                return colorScale((d / 100));
                            } else {
                                return "#93a1a1";
                            }
                        })
                        .attr("width", function(d) {
                            return second_xScale(d);
                        });

                    labelBarTwo
                        .attr("x", 0)
                        .attr("y", function(d, i) {
                            var numBars = varPers.length;
                            return i * bothChartHeight / numBars;
                        })
                        .attr("height", second_yScale.bandwidth())
                        .attr("fill", unfilled)
                        .attr("width", chartLabelWidth - bothChartPadding);

                    labelTwo
                        .text(function(d) {
                            return d;
                        })
                        .attr("font-size", function() {

                            var current = parseInt($(this).css("font-size")),
                                barLength = chartLabelWidth,
                                textBox = this.getBoundingClientRect().width,
                                currentThreshold = document.getElementById('resizeSliderHandle')
                                .getBoundingClientRect().left

                            if (resizeDict[this.textContent] === undefined) {

                                if (textBox >= barLength * 0.8) {
                                    resizeDict[this.textContent] = {
                                        'size': current,
                                        'threshold': currentThreshold
                                    };
                                    return resizeDict[this.textContent]['size'];
                                }

                            } else if (resizeDict[this.textContent] !== undefined) {

                                if (currentThreshold >= resizeDict[this.textContent]['threshold']) {
                                    return resizeDict[this.textContent]['size'];
                                }
                            }

                            return second_yScale.bandwidth() / 1.5;
                        })
                        .attr("x", function() {
                            var barLength = chartLabelWidth - bothChartPadding;
                            var textLength = this.getComputedTextLength();
                            return (barLength - textLength) / 2;
                        })
                        .attr("y", function(d) {
                            return second_yScale(d) + (second_yScale.bandwidth() / 1.5);
                        });

                    // enter
                    barTransparent
                        .enter()
                        .append("rect")
                        .attr("class", "barTransparent")
                        .attr("fill", unfilled)
                        .attr("stroke", "black")
                        .attr("stroke-opacity", 0)
                        .attr("stroke-width", 2)
                        .attr("x", chartLabelWidth)
                        .attr("y", function(d, i) {
                            var numBars = varPers.length;
                            return i * bothChartHeight / numBars;
                        })
                        .attr("height", second_yScale.bandwidth())
                        .attr("width", second_xScale(100));

                    barTwo
                        .enter()
                        .append("rect")
                        .attr("class", "barTwo")
                        .attr("id", "firstSecondBars")
                        .attr("fill", function(d) {
                            return colorScale((d / 100));
                        })
                        .attr("stroke", "#586e75")
                        .attr("stroke-opacity", 0)
                        .attr("stroke-width", 2)
                        .attr("x", chartLabelWidth)
                        .attr("y", function(d, i) {
                            var numBars = varPers.length;
                            return i * bothChartHeight / numBars;
                        })
                        .attr("height", second_yScale.bandwidth())
                        .attr("width", function(d) {
                            return second_xScale(d);
                        });

                    labelBarTwo
                        .enter()
                        .append("rect")
                        .attr("class", "labelBarTwo")
                        .attr("x", 0)
                        .attr("y", function(d, i) {
                            var numBars = varPers.length;
                            return i * bothChartHeight / numBars;
                        })
                        .attr("height", second_yScale.bandwidth())
                        .attr("fill", unfilled)
                        .attr("width", chartLabelWidth - bothChartPadding);

                    labelTwo
                        .enter()
                        .append("text")
                        .attr("class", "labelTwo")
                        .text(function(d) {
                            return d;
                        })
                        .attr("font-size", function() {
                            return second_yScale.bandwidth() / 1.5;
                        })
                        .attr("fill", "#586e75")
                        .attr("x", function() {
                            var barLength = chartLabelWidth - bothChartPadding;
                            var textLength = this.getComputedTextLength();
                            return (barLength - textLength) / 2;
                        })
                        .attr("y", function(d) {
                            return second_yScale(d) + (second_yScale.bandwidth() / 1.5);
                        });

                    // exit
                    //    barTransparent.exit().remove();
                    //    barTwo.exit().remove();
                    //    labelBarTwo.exit().remove();
                    //    labelTwo.exit().remove();

                    chartTwo.select(".xAxis")
                        .call(second_xAxis)
                        .attr("transform", "translate(" + chartLabelWidth + "," + bothChartHeight + ")");

                }

                drawFirstChart(countryStart, countryEnd, durationMini, selectedMagnitude);
                drawSecondChart(selectedMagnitude);

                chartOne.selectAll(".bar")
                    .on("click", function(d) {

                        chartOne.selectAll(".bar")
                            .attr("fill", unfilled);

                        d3.select(this)
                            .attr("fill", function() {
                                return filled
                            });

                        currentCountry = d.country;

                        bar.clicked = this;

                        pushVariableData(currentCountry);
                        drawSecondChart(selectedMagnitude);
                    })
                    .on("mouseover", function(d) {

                        if (dragging === false && resizeDragging === false) {

                            // fill bar
                            d3.select(this)
                                .attr("fill", filled);

                            // add tooltip
                            var lineSumm = '<p class="ttipPrimaryOne">' + d.country +
                                '<span class="ttipSecondaryOne">' + ' faces a ' + '</span>' +
                                formatDecimal(d.mean_p) +
                                '<span class="ttipSecondaryOne">' + " risk of a state-led mass killing in " + '</span>' +
                                "2015." + '</p>' + '</br class="secondary">',
                                lineExplan = '<p class="ttipTertiaryOne">' +
                                "This forecast is an average of risk scores from three statistical models:  Bad Regime, Elite Threat, and Random Forest." +
                                '</p>';

                            if (window.scrollY === 0) {
                                ttipChartOne
                                    .style("display", "inline-block")
                                    .html(lineSumm + lineExplan);
                            }
                        }

                    })
                    .on("mousemove", function() {

                        ttipChartOne
                            .style("top", function() {

                                var ttipHeight = $(this).height();
                                var chartPos = $(".chartOne").position().top;

                                if ((ttipHeight + d3.event.pageY - chartPos) <= bothChartHeight) {
                                    return d3.event.pageY + margin.ttip + "px";
                                } else {
                                    return d3.event.pageY - ttipHeight - (margin.ttip * 2) + "px";
                                }


                            })
                            .style("left", function() {

                                var ttipWidth = $(this).width();
                                return d3.event.pageX - ttipWidth / 2 + "px";

                            });
                    })
                    .on("mouseout", function(d) {

                        ttipChartOne.style("display", "none");

                        if (d.country !== currentCountry) {
                            d3.select(this)
                                .transition()
                                .duration(250)
                                .attr("fill", unfilled);
                        }
                    });

                chartTwo.selectAll(".barTwo")
                    .on("mouseover", function(d, i) {

                        if (dragging === false && resizeDragging === false) {

                            var lineTitle = '<p class="ttipPrimary">' + ttipVar[i] + '</p>',
                                lineMetric = '<p class="ttipSecondary">' + "Metric" + '</p>',
                                lineMetricVal = '<p class="ttipTertiary">' + ttipMetric[i] + '</p>',
                                lineCountry = '<p class="ttipSecondary">' + "Country" + '</p>',
                                lineCountryVal = '<p class="ttipTertiary">' + currentCountry + '</p>',
                                linePercentile = '<p class="ttipSecondary">' + "Percentile" + '</p>',
                                linePercentileVal = '<p class="ttipTertiary">' + d + "%" + '</p>',
                                lineValue = '<p class="ttipSecondary">' + "Value" + '</p>',
                                lineValueVal = '<p class="ttipTertiary">' + varVals[i] + '</p>',
                                lineData = '<p class="ttipSecondary">' + "Data source" + '</p>',
                                lineDataVal = '<p class="ttipTertiary">' + ttipDataSource[i] + '</p>';

                            ttip
                                .style("display", "inline-block")
                                .html(lineTitle +
                                    lineCountry + lineCountryVal +
                                    linePercentile + linePercentileVal +
                                    lineValue + lineValueVal +
                                    lineMetric + lineMetricVal +
                                    lineData + lineDataVal);

                            d3.select(this)
                                .style("stroke-opacity", 1);

                        }

                    })
                    .on("mousemove", function() {

                        ttip
                            .style("top", function() {

                                var ttipHeight = $(this).height();
                                var chartPos = $(".chartTwo").position().top;

                                if ((ttipHeight + d3.event.pageY - chartPos) <= bothChartHeight) {
                                    return d3.event.pageY + margin.ttip + "px";
                                } else {
                                    return d3.event.pageY - ttipHeight - (margin.ttip * 2) + "px";
                                }

                            })
                            .style("left", function() {

                                var ttipWidth = $(this).width();
                                return d3.event.pageX - ttipWidth / 2 + "px";

                            });
                    })
                    .on("mouseout", function() {
                        // new ttip stuff
                        ttip.style("display", "none");

                        d3.select(this)
                            .style("stroke-opacity", 0);
                    });

                var scrollIndex = 0;
                var scrollSensitivity = 2;

                $('#chartOne')
                    .on('mousewheel', function(event) {
                        ttipChartOne.style("display", "none");
                        scrollIndex += 1;
                        if (event.deltaY < 0 && scrollIndex % scrollSensitivity === 0) {

                            if (countryEnd < dictionary_data.length) {

                                countryStart = countryStart + 1;
                                countryEnd = countryEnd + 1;
                                sliderHandle
                                    .transition()
                                    .duration(10)
                                    .attr("cx", sliderScale.invert(countryStart));
                                drawFirstChart(countryStart, countryEnd, 0, selectedMagnitude);
                                drawSliderTtip(countryStart, countryEnd);
                            }

                        } else if (event.deltaY > 0 && scrollIndex % scrollSensitivity === 0) {

                            if (countryStart > 0) {
                                countryStart = countryStart - 1;
                                countryEnd = countryEnd - 1;
                                sliderHandle
                                    .transition()
                                    .duration(10)
                                    .attr("cx", sliderScale.invert(countryStart));
                                drawFirstChart(countryStart, countryEnd, 0, selectedMagnitude);
                                drawSliderTtip(countryStart, countryEnd);
                            }
                        }

                    });

                function searched() {

                    var searched = document.getElementById("searchBar").value;

                    if ($.inArray(searched, varDictKeys) !== -1) {

                        var oldCountryStart = countryStart;
                        var oldCountryEnd = countryEnd;

                        countryStart = Math.min(Math.max($.inArray(searched, varDictKeys) - Math.trunc(numCountries / 2),
                            0), varDictKeys.length - numCountries);
                        countryEnd = Math.min(Math.max($.inArray(searched, varDictKeys) + Math.round(numCountries / 2),
                            numCountries), varDictKeys.length);

                        currentCountry = searched;
                        var numCharts = countryEnd - oldCountryEnd;

                        if (Math.abs(numCharts) < 20) {

                            drawFirstChart(countryStart, countryEnd, durationMini, selectedMagnitude)

                        } else if (numCharts > 0) {

                            for (var i = 0; i < numCharts; i++) {
                                (function(i) {
                                    setTimeout(function timer() {
                                        sliderHandle
                                            .transition()
                                            .duration(10)
                                            .attr("cx", sliderScale.invert(oldCountryStart + i));
                                        drawFirstChart(oldCountryStart + i, oldCountryEnd + i, 10, selectedMagnitude);
                                        drawSliderTtip(oldCountryStart + i, oldCountryEnd + i);
                                    }, i * 10);
                                })(i);
                            }

                        } else if (numCharts < 0) {

                            for (var i = 0; i <= (numCharts * -1); i++) {
                                (function(i) {
                                    setTimeout(function timer() {
                                        sliderHandle
                                            .transition()
                                            .duration(10)
                                            .attr("cx", sliderScale.invert(oldCountryStart - i));
                                        drawFirstChart(oldCountryStart - i, oldCountryEnd - i, 10, selectedMagnitude);
                                        drawSliderTtip(oldCountryStart - i, oldCountryEnd - i);
                                    }, i * 10);
                                })(i);
                            }
                        }

                        pushVariableData(currentCountry);
                        drawSecondChart(selectedMagnitude);

                    }
                }

                // autocompletion for search bar
                var mappedOptions = $.map(options, function(country) {
                    return {
                        value: country,
                        data: {
                            category: 'COUNTRY'
                        }
                    };
                });
                $('#searchBar').devbridgeAutocomplete({
                    lookup: mappedOptions,
                    minChars: 2,
                    triggerSelectOnValidInput: false,
                    onSelect: searched
                });

                // search bar interactivity
                d3.select(".searchButton")
                    .on("click", searched);

                // function for interactivity for buttons
                function modelUpdate() {
                    chartTwo.selectAll(".barTwo")
                        .data(varPers)
                        .transition()
                        .duration(durationMain)
                        .attr("fill", function(d, i) {
                            if (selectedButton === "allIndex" || buttonArray.includes(i)) {
                                return colorScale((d / 100));
                            } else {
                                return "#93a1a1";
                            }
                        })
                }

                d3.selectAll(".button")
                    .on("click", function() {
                        selectedButton = d3.select(this).attr("data-val") + "Index";
                        buttonArray = window[selectedButton];
                        d3.select(".current").classed("current", false);
                        d3.select(this).classed("current", true);
                        modelUpdate();
                    });


                function resize() {
                    setSecondDimensions();
                    setSecondScales(chartTwoWidth, bothChartHeight);
                    resizeSearch();
                }

                d3.select(window).on('resize', resize);

                resize();

            }
        });

    // EXTRA CODE
    // // Preventing page from scrolling on mousewheel event
    // $(window).bind('mousewheel DOMMouseScroll', function(event) { return false });
    // $(window).on('scroll', function() {
    //     var dh = $(document).height(),
    //         wh = $(window).height(),
    //         st = $(window).scrollTop();
    //     if (st <= 0) {
    //         $(this).scrollTop(0);
    //     } else if (st + wh >= dh) {
    //         $(this).scrollTop(dh);
    //     }
    // });

}