/**
 * Created with JetBrains PhpStorm.
 * User: Scott
 * Date: 5/31/13
 * Time: 6:54 PM
 * To change this template use File | Settings | File Templates.
 */


var points = [];
var origin = { x: 0, y: 0 };
var spacing = 25; // Grid lines
var intervals = 20; // Interpolations
var moving = false;
var movingDiv;

var canvas;
var context;

var canvasDebug;
var canvasDebugContext;

var markerCanvas;

// Controls
var grid = true;
var snap = false;

var tutorial = 0;
var tutorials = [];


var strings = {};
strings.RESET = "Clear all points and start over?";
strings.DRAW = "draw";
strings.DELETE = "delete";

var debug = false;
var mode;

var endPoint = 0;
var currentPoint = null;


init();

function init()
{
    /*
    setTimeout( function() {
        document.body.removeChild( document.getElementsByTagName( 'header' )[0] );
        document.body.removeChild( document.getElementsByTagName( 'footer' )[0] );
        }, 1000 );
        */


    canvas = document.getElementById( 'lines' );
    context = canvas.getContext( '2d' );


    canvasDebug = document.getElementById( 'debug' );
    canvasDebugContext = canvasDebug.getContext( '2d' );


    origin.x = canvas.width * 0.5;
    origin.y = canvas.height * 0.5;

    mode = strings.DRAW;

	// Capture mousedowns so lines can be split/dragged in one motion
    $( '#stage' ).mousedown( clickCanvas );
    $( '#stage' ).click( clickCanvas );

    $( '#grid' ).attr( 'checked', 'checked' );
    $( '#grid' ).change( clickGrid );

    $( '#snap' ).change( clickSnap );

    // $( '#mode' ).click( changeMode );
    $( 'input[name="mode"]' ).click( changeMode );

    $( '#reset' ).click( reset );

    $( '#share' ).click( function( e ) { openOverlay( 'share' ); return false; });
    $( '#about' ).click( function( e ) { openOverlay( 'about' ); return false; });
    $( 'a[href="#close"]' ).click( closeOverlay );

    $( '#overlay' ).click( closeOverlay );
    $( '#overlay article' ).click( function( e ) { e.stopImmediatePropagation(); } );

    document.getElementById( 'shareUrl' ).onclick = function( e ) { e.currentTarget.select(); };



    document.onkeydown = keyDownHandler;
    document.onkeyup = keyUpHandler;


    // $( window ).resize( resize );
    window.addEventListener( 'resize', resize )
    window.addEventListener( 'mousemove', moveHandler );
    window.addEventListener( 'touchmove', moveHandler );


    $( '#settings li:first-child' ).click( function() {
        $( '#settings ul' ).toggle();
    });



    initIcons();

    drawGridLines();

    initPoints();

    // Draw all points/markers/debug
    resize();


    if ( points.length == 0 )
    {
        // Init dialogue
        $( '#dialogue ul li').each(
            function( i, e )
            {
                tutorials.push( e.innerHTML );
            }
        );
    }

    document.getElementById( 'dialogue' ).innerHTML = '';
    document.getElementById( 'dialogue' ).style.display = 'block';

    updateTutorial();
}




var keysActive = {};

function keyDownHandler( e )
{
    keysActive[ e.which ] = true;
}

function keyUpHandler( e )
{
    // console.log( e.which );

    switch( e.which )
    {
        // esc = close overlay
        case 27:
            closeOverlay();
            break;

        // g = grid
        case 71:
            clickGrid( e );
            break;

        // s = snap
        case 83:
            clickSnap( e );
            break;

        // d = mode
        // case 68:
            // Do nothing
            // break;

        // m = mode
        case 77:
            changeMode();
            break;

        // r = reset
        case 82:
            if ( ! keysActive[ 17 ] // Ctrl
                    && keysActive[ 82 ]
                    )
            {
                reset();
            }
            break;

        default:
            // console.log(e.which);
            break;
    }

    keysActive[ e.which ] = false;
}






/**
 * Markers
 */

function initIcons()
{
    markerCanvas = document.createElement( 'canvas' );
    markerCanvas.height = 100;
    markerCanvas.width = 200;
    markerCanvas.style.position = 'absolute';
    markerCanvas.style.zIndex = 50000;
    markerCanvas.style.backgroundColor = '#333';


    // Init for future lines
    var markerContext = markerCanvas.getContext( '2d' );


    // Default end point
    markerContext.fillStyle = 'gold';
    markerContext.beginPath();
    markerContext.arc( 10, 10, 4, 0, 2 * Math.PI );
    markerContext.fill();
    markerContext.closePath();

    markerContext.beginPath();
    markerContext.strokeStyle = 'gold';
    markerContext.lineWidth = 2;
    markerContext.arc( 10, 10, 8, 0, 2 * Math.PI );
    markerContext.stroke();
    markerContext.closePath();


    // Default point
    markerContext.fillStyle = 'gold';
    markerContext.beginPath();
    markerContext.arc( 10, 30, 4, 0, 2 * Math.PI );
    markerContext.fill();
    markerContext.closePath();


    // Active point
    markerContext.fillStyle = 'white';
    markerContext.beginPath();
    markerContext.arc( 10, 50, 4, 0, 2 * Math.PI );
    markerContext.fill();
    markerContext.closePath();

    markerContext.beginPath();
    markerContext.strokeStyle = 'white';
    markerContext.lineWidth = 2;
    markerContext.arc( 10, 50, 8, 0, 2 * Math.PI );
    markerContext.stroke();
    markerContext.closePath();


    // Active point
    markerContext.fillStyle = 'white';
    markerContext.beginPath();
    markerContext.arc( 10, 70, 4, 0, 2 * Math.PI );
    markerContext.fill();
    markerContext.closePath();


    if ( debug )
    {
        document.body.appendChild( markerCanvas );
        document.body.appendChild( canvasDebugContext );
    }
}

function addMarker( pt, prepend )
{
    id = ( prepend ) ? 0 : points.length - 1 ;

    var div = document.createElement( 'div' );
    div.className = 'marker';
    div.setAttribute( 'data', id );
    div.style.top = pt.y + origin.y + 'px';
    div.style.left = pt.x + origin.x + 'px';

    div.addEventListener( 'mousedown', touchStartHandler );
    div.addEventListener( 'touchstart', touchStartHandler );

    div.addEventListener( 'mouseup', touchEnd );
    div.addEventListener( 'touchend', touchEnd );

    if ( prepend )
    {
        document.getElementById( 'markers' ).insertBefore( div, document.getElementById( 'markers' ).firstChild );
    }
    else
    {
        document.getElementById( 'markers' ).appendChild( div );
    }
}

function insertMarkerAt( pt, pos )
{
    var div = document.createElement( 'div' );
    div.className = 'marker';
    div.setAttribute( 'data', pos );
    div.style.top = pt.y + origin.y + 'px';
    div.style.left = pt.x + origin.x + 'px';

    div.addEventListener( 'mousedown', touchStartHandler );
    div.addEventListener( 'touchstart', touchStartHandler );

    div.addEventListener( 'mouseup', touchEnd );
    div.addEventListener( 'touchend', touchEnd );

    // console.log( pos, div );
    document.getElementById( 'markers' ).insertBefore( div, document.getElementById( 'markers' ).childNodes[ pos ] );

    return div;
}

function indexMarkers()
{
    $( '.marker' ).each(
        function( i, e )
        {
            e.setAttribute( 'data', i );
        }
    )
}

function removeMarkers()
{
    $( '.marker' ).each(
        function( i, e )
        {
            document.getElementById( 'markers' ).removeChild( e );
        }
    )
}

function removeMarker( num )
{
    document.getElementById( 'markers' ).removeChild( document.getElementById( 'markers' ).children[ num ] );
}


/**
 * Events
 */

function touchStartHandler( e )
{
    e.preventDefault();

    touchStart( e.currentTarget );
}

function touchStart( elem )
{
    // e.preventDefault();

    var id = parseInt( elem.getAttribute( 'data' ), 10 );
    console.log( elem, id );

    if ( mode == strings.DELETE )
    {
        // console.log( id );
        points.splice( id, 1 );
        removeMarker( id );
        indexMarkers();

        endPoint = ( endPoint == 0 ) ? 0 : points.length - 1 ;

        clearCanvas();
        drawAllPoints();
    }
    else
    {
        movingDiv = elem;
        moving = true;

        currentPoint = id;

        // Update active point if applicable
        if ( endPoint != id
            && ( id == 0 || id == points.length - 1 )
            )
        {
            endPoint = id;
        }

        clearCanvas();
        drawAllPoints();
    }
}

function touchEnd( e )
{
    e.preventDefault();

    currentPoint = null;
    moving = false;

    clearCanvas();
    drawAllPoints();
}


function getCurrentLine( p )
{
    // console.log( 'Yep!' );
    // Get the CanvasPixelArray from the given coordinates and dimensions.
    var imgd = canvasDebugContext.getImageData( p.x, p.y, 1, 1 );
    var pix = imgd.data;
    // console.log( pix );

    // var id = pix[ 0 ];
    return pix[ 0 ];
}

function isTouchingLine( p )
{
    var imgd = canvasDebugContext.getImageData( p.x, p.y, 1, 1 );
    return ( imgd.data[0] > 0 );
    // var pix = imgd.data;
}


function moveHandler( e )
{
    if ( moving )
    {
        moveMarker( e );
    }
    else
    {
        var p = { x: e.pageX, y: e. pageY };

        if ( points.length > 1 )
        {
            if ( isTouchingLine( p ) && mode == strings.DRAW )
            {
                document.body.style.cursor = "pointer";
            }
            else
            {
                document.body.style.cursor = "default";
            }
        }
        // Zany trig solving
        else if ( points.length > 1
                && false
                )
        {
            canvasDebugContext.clearRect( 0, 0, canvasDebug.width, canvasDebug.height );

            for ( var i = 0; i < points.length - 1; i++ )
            {
                var x1 = points[ i ].x + origin.x;
                var x2 = points[ i + 1 ].x + origin.x;

                var y1 = points[ i ].y + origin.y;
                var y2 = points[ i + 1 ].y + origin.y;

                var inBoundsX = false;
                var inBoundsY = false;

                if ( x1 < x2 )
                {
                    if ( p.x > x1 && p.x < x2 ) inBoundsX = true;
                }
                else
                {
                    if ( p.x < x1 && p.x > x2 ) inBoundsX = true;
                }

                if ( y1 < y2 )
                {
                    if ( p.y > y1 && p.y < y2 ) inBoundsY = true;
                }
                else
                {
                    if ( p.y < y1 && p.y > y2 ) inBoundsY = true;
                }


                if ( inBoundsX && inBoundsY )
                {
                    canvasDebugContext.beginPath();
                    canvasDebugContext.fillStyle = 'rgba( 0, 255, 0, 0.2 )';
                    canvasDebugContext.rect( x1, y1, x2 - x1, y2 - y1 );
                    canvasDebugContext.fill();
                    canvasDebugContext.closePath();

                    canvasDebugContext.beginPath();
                    canvasDebugContext.fillStyle = 'none';
                    canvasDebugContext.strokeStyle = '#fff';

                    canvasDebugContext.moveTo( x1, y1 );
                    canvasDebugContext.lineTo( p.x, p.y );
                    canvasDebugContext.lineTo( x2, y2 );
                    canvasDebugContext.lineTo( x1, y1 );
                    canvasDebugContext.stroke();

                    canvasDebugContext.closePath();
                }
            }
        }
    }
}

function moveMarker( e )
{
    e.preventDefault();

    var p = { x: e.pageX - origin.x, y: e. pageY - origin.y };

    if ( e.type == 'touchmove' )
    {
        p.x = e.touches[ 0 ].pageX - origin.x;
        p.y = e.touches[ 0 ].pageY - origin.y;
    }

    if ( snap ) p = snapPoint( p );

    movingDiv.style.top = p.y + origin.y + 'px';
    movingDiv.style.left = p.x + origin.x + 'px';

    updatePoint( movingDiv.getAttribute( 'data' ), p );

    clearCanvas();
    drawAllPoints();
}








function updateTutorial()
{
    if ( tutorial < tutorials.length + 1 )
    {
        var str = ( tutorial < tutorials.length ) ? tutorials[ tutorial ] : '' ;
        tutorial++;
        updateDialogue( str );
    }
}

function updateDialogue( str )
{
    // $( '#dialogue' ).text( str );
    $( '#dialogue' ).html( str );
}







function clickGrid( e )
{
    grid = ! grid ;

    if ( grid )
    {
        document.getElementById( 'grid' ).setAttribute( 'checked', 'checked' );
        document.getElementById("gradient").style.visibility = 'visible';
    }
    else
    {
        document.getElementById( 'grid' ).removeAttribute( 'checked' );
        document.getElementById("gradient").style.visibility = 'hidden';
    }
}

function clickSnap( e )
{
    snap = ! snap ;

    if ( snap )
    {
        document.getElementById( 'snap' ).setAttribute( 'checked', 'checked' );
    }
    else
    {
        document.getElementById( 'snap' ).removeAttribute( 'checked' );
    }
}

function reset()
{
    if ( confirm( strings.RESET ) ) clearAllPoints();
    return false;
}

function changeMode( e )
{
    // console.log( e.currentTarget.value );
    if ( e )
    {
        mode = e.currentTarget.value;
    }
    else
    {
        mode = ( mode == strings.DRAW ) ? strings.DELETE : strings.DRAW ;
    }

    var elems = document.getElementsByName( 'mode' );
    for ( var i = 0; i < elems.length; i++ )
    {
        if ( elems[i].value == mode )
        {
            // console.log( elems[i].value );
            elems[i].checked = 'checked' ;
            elems[i].parentNode.parentNode.className = 'half on';
        }
        else
        {
            elems[i].parentNode.parentNode.className = 'half';
        }
    }
}



function openOverlay( section )
{
    // var state = ( document.getElementById( 'overlay' ).style.display == 'block' ) ? 'none' : 'block' ;

    /*
    if ( state == 'none' )
    {
        var sections = document.getElementById( 'overlay' ).getElementsByTagName( 'section' );
        sections[ 0 ].style.display = 'none';
        sections[ 1 ].style.display = 'none';
    }
    else
    {
        */
        var sections = document.getElementById( 'overlay' ).getElementsByTagName( 'section' );
        sections[ 0 ].style.display = 'none';
        sections[ 1 ].style.display = 'none';

        // console.log( 'Show', section );

        if ( section == 'share' )
        {
            // alert( 'Generate URL' );
            document.getElementById( 'shareUrl' ).value = getShareUrl();
            // document.getElementById( 'shareUrl' ).onclick = function( e ) { e.currentTarget.select(); };
        }

        document.getElementById( section + 'Section' ).style.display = 'block';
    // }
    document.getElementById( 'overlay' ).style.display = 'block';
    return false;
}

function closeOverlay()
{
    var sections = document.getElementById( 'overlay' ).getElementsByTagName( 'section' );
    sections[ 0 ].style.display = 'none';
    sections[ 1 ].style.display = 'none';

    document.getElementById( 'overlay' ).style.display = 'none';
    return false;
}



function getShareUrl()
{
    var url = document.location.href;
    if ( url.indexOf( '#' ) > -1 ) url = url.substr( 0, url.indexOf( '#' ) );

    // JSON
    if ( false )
    {
        var json = { v: 1, p: [] };
        for ( var i = 0; i < points.length; i++ )
        {
            json.p.push( [ points[i].x, points[i].y ] );
        }
        console.log( JSON.stringify( json ) );
    }
    else
    {
        if ( points.length > 0 )
        {
            var arr = [];
            for ( var i = 0; i < points.length; i++ )
            {
                arr.push( points[i].x + ',' + points[i].y );
            }
            url += '#v=1&p=' + arr.join( '|' );
        }
    }
    return url;
}


function initPoints()
{
    if ( document.location.hash != '' )
    {
        var params = {};
        var hash = document.location.hash.substr( 1 ).split( '&' );

        for ( var i = 0; i < hash.length; i++ )
        {
            var kv = hash[ i ].split( '=' );
            params[ kv[ 0 ] ] = kv[ 1 ];
        }

        var coords = [];
        var pointsNew = params.p.split( '|' );

        for ( var j = 0; j < pointsNew.length; j++ )
        {
            coords = pointsNew[ j ].split( ',' );
            addPoint( { x: Number( coords[0] ), y: Number( coords[1] ) } );
        }
    }
}




function resize()
{
    $( '#debug' ).attr( 'height', $( window ).height() );
    $( '#debug' ).attr( 'width', $( window ).width() );

    $( '#lines' ).attr( 'height', $( window ).height() );
    $( '#lines' ).attr( 'width', $( window ).width() );

    $( '#gradient' ).attr( 'height', $( window ).height() );
    $( '#gradient' ).attr( 'width', $( window ).width() );

    origin.x = canvas.width * 0.5;
    origin.y = canvas.height * 0.5;

    $( '.marker' ).each(
        function( i, e )
        {
            e.style.top = points[ i ].y + origin.y + 'px';
            e.style.left = points[ i ].x + origin.x + 'px';
        }
    )

    clearCanvas();
    drawGridLines();
    drawAllPoints();
}



function snapPoint( p )
{
    var realX = Math.abs( p.x );
    var diffX = realX % spacing;
    if ( Math.abs( diffX ) < spacing * 0.5 )
    {
        realX -= diffX;
    }
    else
    {
        realX += spacing - diffX;
    }
    p.x = ( p.x < 0 ) ? realX * -1 : realX ;


    var realY = Math.abs( p.y );
    var diffY = realY % spacing;
    if ( Math.abs( diffY ) < spacing * 0.5 )
    {
        realY -= diffY;
    }
    else
    {
        realY += spacing - diffY;
    }
    p.y = ( p.y < 0 ) ? realY * -1 : realY ;


    return p;
}


function clickCanvas( e )
{
    e.preventDefault();
    if ( moving || mode == strings.DELETE ) return;

    var p = { x: e.pageX - origin.x, y: e.pageY - origin.y };

    var pDebug = { x: e.pageX, y: e.pageY };
    if ( isTouchingLine( pDebug ) )
    {
        if ( snap ) p = snapPoint( p );
        addPoint( p, getCurrentLine( pDebug ) );
    }
    else
    {
        // Currently only allowing mousedown when breaking lines for testing purposes
        if ( e.type == 'mousedown' )
            return;

        if ( snap ) p = snapPoint( p );
        addPoint( p );
    }

    clearCanvas();
    drawAllPoints();
    updateTutorial();
}

function clearCanvas()
{
    if ( false )
    {
        context.beginPath();
        context.fillStyle = '#000000';
        context.rect( 0, 0, canvas.width, canvas.height );
        context.fill();
        context.closePath();
    }
    else if ( true )
    {
        context.clearRect( 0, 0, canvas.width, canvas.height );
        canvasDebugContext.clearRect( 0, 0, canvasDebug.width, canvasDebug.height );
    }
    else
    {
        canvas.width = canvas.width;
    }
}



function addPoint( p, pos )
{
    // Break line in two
    if ( typeof pos != 'undefined' )
    {
        points.splice( pos, 0, p );
        var div = insertMarkerAt( p, pos );
        indexMarkers();
        endPoint = ( endPoint == 0 ) ? 0 : points.length - 1;

		// Start drag now that line is split
        touchStart( div )
    }
    else if ( endPoint == 0
                && points.length > 1
                )
    {
        points.unshift( p );
        addMarker( p, true );
        indexMarkers();
    }
    else
    {
        points.push( p );
        addMarker( p );
        endPoint = points.length - 1;
    }
}

function updatePoint( num, p )
{
    points[ num ] = p;
}

function clearAllPoints()
{
    points = [];
    removeMarkers();
    clearCanvas();

    return false;
}

function drawGridLines()
{
    var canvasGradient = document.getElementById("gradient");
    var contextGradient = canvasGradient.getContext("2d");
    contextGradient.clearRect( 0, 0, canvasGradient.width, canvasGradient.height );

    var context = contextGradient;



    context.strokeStyle = '#333333';
    context.lineWidth = 0.5;


    // Y grid lines
    for ( var i = 0; i < origin.y / spacing; i++ )
    {
        context.lineWidth = ( i * spacing % 100 == 0 ) ? 1 : 0.5 ;

        context.beginPath();

        context.moveTo( 0, origin.y - spacing * i );
        context.lineTo( canvas.width, origin.y - spacing * i );

        context.moveTo( 0, origin.y + spacing * i );
        context.lineTo( canvas.width, origin.y + spacing * i );

        context.stroke();
        context.closePath();
    }


    // X grid lines
    for ( var i = 0; i < origin.x / spacing; i++ )
    {
        context.lineWidth = ( i * spacing % 100 == 0 ) ? 1 : 0.5 ;

        context.beginPath();

        context.moveTo( origin.x - spacing * i, 0 );
        context.lineTo( origin.x - spacing * i, canvas.height );

        context.moveTo( origin.x + spacing * i, 0 );
        context.lineTo( origin.x + spacing * i, canvas.height );

        context.stroke();
        context.closePath();
    }


    // Axis lines
    context.lineWidth = 2;
    context.beginPath();

    // X
    context.moveTo( 0, origin.y );
    context.lineTo( canvas.width, origin.y );

    // Y
    context.moveTo( origin.x, 0 );
    context.lineTo( origin.x, canvas.height );
    context.stroke();

    context.closePath();







    var gradientCanvas = document.createElement( "canvas" );
    gradientCanvas.setAttribute( 'height', 200 );
    gradientCanvas.setAttribute( 'width', 200 );
    gradientCanvas.style.backgroundColor = '#ff0000';
    gradientCanvas.style.position = 'absolute';
    gradientCanvas.style.display = 'block';
    gradientCanvas.style.right = 0;
    gradientCanvas.style.zIndez = 10000;
    var gradientContext = gradientCanvas.getContext("2d");



    var r = gradientCanvas.height * 0.5;
    var grd = gradientContext.createRadialGradient( gradientCanvas.width * 0.5, r, r, gradientCanvas.width * 0.5, gradientCanvas.height * 0.5, 25 );
    grd.addColorStop(0,"rgba(0,0,0,1)");
    grd.addColorStop(0.25,"rgba(0,0,0,0.5)");
    grd.addColorStop(1,"rgba(0,0,0,0)");
    gradientContext.fillStyle = grd;
    gradientContext.fillRect(0,0,gradientCanvas.width,gradientCanvas.height);

    contextGradient.drawImage(gradientCanvas,0,0,gradientCanvas.width,gradientCanvas.height,0,0,canvasGradient.width,canvasGradient.height);
}

function drawAllPoints()
{
    for ( var i = 0; i < points.length; i++ )
    {
        drawPoint( i );
    }
}

function drawPoint( num )
{
    var x = points[ num ].x;
    var y = points[ num ].y;


    // Draw point icons
    var iconY = 0;
    if ( num == endPoint )
    {
        iconY = ( num == currentPoint ) ? 40 : 0 ;
    }
    else
    {
        iconY = ( num == currentPoint ) ? 60 : 20 ;
    }
    context.drawImage( markerCanvas, 0, iconY, 20, 20, x + origin.x - 10, y + origin.y - 10, 20, 20 );


    // Draw lines
    context.strokeStyle = 'gold';
    context.fillStyle = 'gold';
    context.lineWidth = 1;
    if ( num > 0 )
    {
        var pt1 = points[ num - 1 ];

        if ( num > 1 )
        {
            var pt2 = points[ num - 2 ];

            var d1 = { x: ( x - pt1.x ) / intervals,
                y: ( y - pt1.y ) / intervals
            };

            var d2 = { x: ( pt1.x - pt2.x ) / intervals,
                y: ( pt1.y - pt2.y ) / intervals
            };

            // Parabolize..
            for ( var i = 1; i < intervals + 1; i++ )
            {
                context.beginPath();
                context.moveTo( pt1.x + d1.x * i + origin.x, pt1.y + d1.y * i + origin.y );
                context.lineTo( pt2.x + d2.x * i + origin.x, pt2.y + d2.y * i + origin.y );
                context.stroke();
                context.closePath();
            }
        }


        if ( num == currentPoint )
        {
            var grad = context.createLinearGradient( pt1.x + origin.x, pt1.y + origin.y,
                x + origin.x, y + origin.y
            );
            grad.addColorStop( 1, "white" );
            grad.addColorStop( 0, "gold" );
            context.strokeStyle = grad;
            context.lineWidth = 2.5;
        }
        else if ( currentPoint != null )
        {
            if ( ( currentPoint == 0 && num == 1 )
                    || ( num == currentPoint + 1 && currentPoint != 0 )
                    )
            {
                var grad = context.createLinearGradient( x + origin.x, y + origin.y,
                    pt1.x + origin.x, pt1.y + origin.y
                );
                grad.addColorStop( 1, "white" );
                grad.addColorStop( 0, "gold" );
                context.strokeStyle = grad;
                context.lineWidth = 2.5;
            }
        }


        // Draw line between first two points
        context.beginPath();
        context.moveTo( pt1.x + origin.x, pt1.y + origin.y );
        context.lineTo( x + origin.x, y + origin.y );
        context.stroke();
        context.closePath();


        // Refresh canvas hitmap
        canvasDebugContext.strokeStyle = 'rgb( ' + num + ', 0, 0 )';
        canvasDebugContext.lineWidth = 20;
        canvasDebugContext.beginPath();
        canvasDebugContext.moveTo( pt1.x + origin.x, pt1.y + origin.y );
        canvasDebugContext.lineTo( x + origin.x, y + origin.y );
        canvasDebugContext.stroke();
        canvasDebugContext.closePath();
    }
}



// trackEvent( 'Parabolic', 'Reset' );

function trackEvent( category, action, label, value, noninteraction )
{
    label = label || undefined;
    value = ( typeof value == 'number' && value >= 0 ) ? value : undefined ;
    noninteraction = ( noninteraction === true ) || false;

    console.log( 'Track event: ' + category, action, label, value, noninteraction );
    if ( typeof _gaq !== 'undefined' )
    {
        // _gaq.push([ '_trackEvent', category, action, label, value, noninteraction ]);
    }
}

