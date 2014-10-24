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




var strings = {};
strings.RESET               = "Clear all points and start over?";
strings.DRAW                = "draw";
strings.DELETE              = "delete";
strings.ACTVITY_NEW         = 'activityNew';
strings.ACTVITY_RETURNING   = 'activityReturning';


var debug = false;

var endPoint = 0;
var currentPoint = null;












/**
 * PLD controls
 */

var Controls = function()
{
    var keysActive = {};


    this.init = function()
    {
        document.onkeydown = this.onKeyDown;
        document.onkeyup = this.onKeyUp;

        $( '#grid' ).attr( 'checked', 'checked' );
        $( '#grid' ).change( onChangeSetting );
        $( '#snap' ).change( onChangeSetting );
        $( '#reset' ).click( onChangeSetting );


        document.getElementById( 'draw' ).onclick = onChangeSetting;
        document.getElementById( 'delete' ).onclick = onChangeSetting;


        $( '#share' ).click( onChangeSetting );
        $( '#about' ).click( onChangeSetting );
        $( 'a[href="#close"]' ).click( closeOverlay );

        $( '#overlay' ).click( closeOverlay );
        $( '#overlay article' ).click( function( e ) { e.stopImmediatePropagation(); } );

        document.getElementById( 'shareUrl' ).onclick = function( e ) { e.currentTarget.select(); };
        document.querySelector( '#settings li' ).onclick = function(e) {
            $( '#settings ul' ).toggle();
        };
    };

    this.onKeyDown = function( e )
    {
        keysActive[ e.which ] = true;
    };

    this.onKeyUp = function( e )
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
                toggleGrid();
                break;

            // s = snap
            case 83:
                toggleSnap();
                break;

            // m = modePen
            case 77:
                changeMode();
                break;

            // r = reset
            case 82:
                if ( ! keysActive[ 17 ] // Ctrl
                    && keysActive[ 82 ]
                    )
                {
                    app.reset();
                }
                break;

            default:
                // console.log(e.which);
                break;
        }

        keysActive[ e.which ] = false;
    };



};


function onChangeSetting( e )
{
    // console.log(e.currentTarget.id );
    switch( e.currentTarget.id )
    {
        case 'grid':
            toggleGrid();
            break;

        case 'snap':
            toggleSnap();
            break;

        case 'reset':
            app.reset();
            break;

        case 'share':
        case 'about':
            openOverlay( e.currentTarget.id );
            break;

        case 'draw':
        case 'delete':
            changeMode( e );
            break;
    }

    return false;
}



function toggleGrid()
{
    app.grid = ! app.grid ;

    if ( app.grid )
    {
        document.getElementById( 'grid' ).setAttribute( 'checked', 'checked' );
        document.getElementById("lines-grid").style.visibility = 'visible';
    }
    else
    {
        document.getElementById( 'grid' ).removeAttribute( 'checked' );
        document.getElementById("lines-grid").style.visibility = 'hidden';
    }
}

function toggleSnap()
{
    app.snap = ! app.snap ;

    if ( app.snap )
    {
        document.getElementById( 'snap' ).setAttribute( 'checked', 'checked' );
    }
    else
    {
        document.getElementById( 'snap' ).removeAttribute( 'checked' );
    }
}








function changeMode( e )
{
    var value;

    if ( e )
        value = e.currentTarget.querySelector( 'span input' ).value;

    if ( value )
    {
        app.modePen = value;
    }
    else
    {
        app.modePen = ( app.modePen == strings.DRAW ) ? strings.DELETE : strings.DRAW ;
    }

    var elems = document.getElementsByName( 'mode' );
    for ( var i = 0; i < elems.length; i++ )
    {
        if ( elems[i].value == app.modePen )
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




/**
 * Menus and navigation
 */

function openOverlay( section )
{
    // console.log( 'Show', section );
    var sections = document.getElementById( 'overlay' ).getElementsByTagName( 'section' );
    sections[ 0 ].style.display = 'none';
    sections[ 1 ].style.display = 'none';

    if ( section == 'share' )
    {
        document.getElementById( 'shareUrl' ).value = getShareUrl();
    }

    document.getElementById( section + 'Section' ).style.display = 'block';
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

    /*
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
    */
        if ( points.length > 0 )
        {
            var arr = [];
            for ( var i = 0; i < points.length; i++ )
            {
                arr.push( points[i].x + ',' + points[i].y );
            }
            url += '#v=1&p=' + arr.join( '|' );
        }
    // }
    return url;
}















/**
 * PLD app
 */

var ParabolicLineDesigns = function()
{
    // Controls
    this.grid = true;
    this.snap = false;

    this.modePen = strings.DRAW;
    this.modeActivity = strings.ACTVITY_NEW;


    this.tutorial = null;
    this.controls = null;


    this.pointStatesCanvas;


    this.init = function()
    {
        this.controls = new Controls();
        this.controls.init();

        this.tutorial = new Tutorial();
        this.tutorial.init( app.modeActivity );
        this.tutorial.next();


        canvas = document.getElementById( 'lines' );
        context = canvas.getContext( '2d' );


        canvasDebug = document.getElementById( 'debug' );
        canvasDebugContext = canvasDebug.getContext( '2d' );


        origin.x = canvas.width * 0.5;
        origin.y = canvas.height * 0.5;




        this.drawPointStates();
        this.drawGrid();

        initPoints();

        // Draw all points/markers/debug
        this.resize();



        // Handlers
        document.getElementById( 'stage' ).onmousedown = this.clickCanvas.bind(this);
        window.addEventListener( 'resize', this.resize.bind(this) );
        window.addEventListener( 'mousemove', moveHandler );
        window.addEventListener( 'touchmove', moveHandler );
    };

    this.reset = function()
    {
        if ( confirm( strings.RESET ) ) clearAllPoints();
    };

    this.resize = function()
    {
        var elems;

        // Resize #debug, #lines, and #gradient
        elems = document.querySelectorAll( 'canvas' );
        for ( var i = 0; i < elems.length; i++ )
        {
            elems[i].setAttribute( 'height', window.innerHeight );
            elems[i].setAttribute( 'width', window.innerWidth );
        }

        origin.x = canvas.width * 0.5;
        origin.y = canvas.height * 0.5;

        elems = document.querySelectorAll( '.marker' );
        for ( var j = 0; j < elems.length; j++ )
        {
            elems[j].style.top = points[j].y + origin.y + 'px';
            elems[j].style.left = points[j].x + origin.x + 'px';
        }

        this.clearCanvas();
        this.drawGrid();
        drawAllPoints();
    };


    /** HANDLERS **/

    this.clickCanvas = function( e )
    {
        // console.log(e);
        e.preventDefault();

        if ( moving || this.modePen == strings.DELETE ) return;

        var p = { x: e.pageX - origin.x, y: e.pageY - origin.y };

        var pDebug = { x: e.pageX, y: e.pageY };
        if ( isTouchingLine( pDebug ) )
        {
            if ( this.snap ) p = snapPoint( p );
            addPoint( p, getCurrentLine( pDebug ) );
        }
        else
        {
            if ( this.snap ) p = snapPoint( p );
            addPoint( p );
        }

        this.clearCanvas();
        drawAllPoints();

        // console.log( this, this.tutorial );
        this.tutorial.next();
    };




    this.clearCanvas = function()
    {
        // Various ways to force canvas to be cleared
        if ( true )
        {
            context.clearRect( 0, 0, canvas.width, canvas.height );
            canvasDebugContext.clearRect( 0, 0, canvasDebug.width, canvasDebug.height );
        }
        else if ( false )
        {
            context.beginPath();
            context.fillStyle = '#000000';
            context.rect( 0, 0, canvas.width, canvas.height );
            context.fill();
            context.closePath();
        }
        else
        {
            canvas.width = canvas.width;
        }
    };



    /** DRAWING OPS **/

    // Cache graphics for point states
    this.drawPointStates = function()
    {
        this.pointStatesCanvas = document.createElement( 'canvas' );
        this.pointStatesCanvas.height = 100;
        this.pointStatesCanvas.width = 200;
        // markerCanvas.style.position = 'absolute';

        var context = this.pointStatesCanvas.getContext( '2d' );

        // Default end point
        this.drawCircle( context, 'gold', 10, 10, 4 );
        this.drawCircle( context, 'gold', 10, 10, 8, true );

        // Default point
        this.drawCircle( context, 'gold', 10, 30, 4 );

        // Active end point
        this.drawCircle( context, 'white', 10, 50, 4 );
        this.drawCircle( context, 'white', 10, 50, 8, true );

        // Active point
        this.drawCircle( context, 'white', 10, 70, 4 );

        if ( debug )
        {
            document.body.appendChild( this.pointStatesCanvas );
            document.body.appendChild( canvasDebugContext );
        }
    };

    this.drawCircle = function( context, style, x, y, radius, stroked )
    {
        stroked = stroked || false;

        if ( stroked )
        {
            context.beginPath();
            context.strokeStyle = style;
            context.lineWidth = 2;
            context.arc( x, y, radius, 0, 2 * Math.PI );
            context.stroke();
            context.closePath();
        }
        else
        {
            context.beginPath();
            context.fillStyle = style;
            context.arc( x, y, radius, 0, 2 * Math.PI );
            context.fill();
            context.closePath();
        }
    };

    this.drawGrid = function()
    {
        var gridCanvas = document.getElementById("lines-grid");
        var context = gridCanvas.getContext("2d");
        context.clearRect( 0, 0, gridCanvas.width, gridCanvas.height );
        context.strokeStyle = '#333333';
        context.lineWidth = 0.5;

        // Y grid lines
        for ( var i = 0; i < origin.y / spacing; i++ )
        {
            context.lineWidth = ( i * spacing % 100 == 0 ) ? 1 : 0.5 ;

            context.beginPath();
            context.moveTo( 0, origin.y - spacing * i );
            context.lineTo( gridCanvas.width, origin.y - spacing * i );
            context.moveTo( 0, origin.y + spacing * i );
            context.lineTo( gridCanvas.width, origin.y + spacing * i );
            context.stroke();
            context.closePath();
        }

        // X grid lines
        for ( var j = 0; j < origin.x / spacing; j++ )
        {
            context.lineWidth = ( j * spacing % 100 == 0 ) ? 1 : 0.5 ;

            context.beginPath();
            context.moveTo( origin.x - spacing * j, 0 );
            context.lineTo( origin.x - spacing * j, gridCanvas.height );
            context.moveTo( origin.x + spacing * j, 0 );
            context.lineTo( origin.x + spacing * j, gridCanvas.height );
            context.stroke();
            context.closePath();
        }

        // X/Y axis lines
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo( 0, origin.y );
        context.lineTo( canvas.width, origin.y );
        context.moveTo( origin.x, 0 );
        context.lineTo( origin.x, canvas.height );
        context.stroke();
        context.closePath();

        // Create fade to black
        var gradientCanvas = document.createElement( "canvas" );
        gradientCanvas.setAttribute( 'height', 200 );
        gradientCanvas.setAttribute( 'width', 200 );

        var r = gradientCanvas.height * 0.5;
        var gradientContext = gradientCanvas.getContext("2d");
        var gradientFill = gradientContext.createRadialGradient( gradientCanvas.width * 0.5, r, r, gradientCanvas.width * 0.5, gradientCanvas.height * 0.5, 25 );
        gradientFill.addColorStop(0,"rgba(0,0,0,1)");
        gradientFill.addColorStop(0.25,"rgba(0,0,0,0.5)");
        gradientFill.addColorStop(1,"rgba(0,0,0,0)");
        gradientContext.fillStyle = gradientFill;
        gradientContext.fillRect(0,0,gradientCanvas.width,gradientCanvas.height);

        // Draw gradient above grid
        context.drawImage(gradientCanvas,0,0,gradientCanvas.width,gradientCanvas.height,0,0,gridCanvas.width,gridCanvas.height);
    };



    /** CONVENIENCE **/

    // Stub for analytics
    this.trackEvent = function( action, label, value, noninteraction ) {};
};








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

    return div;
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

    if ( app.modePen == strings.DELETE )
    {
        // console.log( id );
        points.splice( id, 1 );
        removeMarker( id );
        indexMarkers();

        endPoint = ( endPoint == 0 ) ? 0 : points.length - 1 ;

        app.clearCanvas();
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

        app.clearCanvas();
        drawAllPoints();
    }
}

function touchEnd( e )
{
    e.preventDefault();

    currentPoint = null;
    moving = false;

    app.clearCanvas();
    drawAllPoints();
}


// Get the CanvasPixelArray from the given coordinates and dimensions.
function getCurrentLine( p )
{
    var imgd = canvasDebugContext.getImageData( p.x, p.y, 1, 1 );
    // console.log( imgd.data );

    return imgd.data[ 0 ];
}

function isTouchingLine( p )
{
    var imgd = canvasDebugContext.getImageData( p.x, p.y, 1, 1 );
    return ( imgd.data[0] > 0 );
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
            if ( isTouchingLine( p ) && app.modePen == strings.DRAW )
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

    if ( app.snap ) p = snapPoint( p );

    movingDiv.style.top = p.y + origin.y + 'px';
    movingDiv.style.left = p.x + origin.x + 'px';

    // Update point
    points[ movingDiv.getAttribute( 'data' ) ] = p;

    app.clearCanvas();
    drawAllPoints();
}




function initPoints()
{
    if ( document.location.hash != '' )
    {
        var params = {};
        var hash = document.location.hash.substr( 1 ).split( '&' );
        // console.log( hash );

        for ( var i = 0; i < hash.length; i++ )
        {
            var kv = hash[ i ].split( '=' );
            if ( kv.length == 1 )
                continue;

            // console.log( kv );
            params[ kv[ 0 ] ] = kv[ 1 ];
        }
        // console.log( params );


        if ( typeof( params.p ) === "undefined" )
            return;

        var points = params.p.split( '|' );
        if ( points.length == 0 )
        {
            alert( 'No points!' );
            return;
        }

        var point = [];
        for ( var j = 0; j < points.length; j++ )
        {
            point = points[ j ].split( ',' );
            addPoint( { x: Number( point[0] ), y: Number( point[1] ) } );
        }


        app.modeActivity = strings.ACTVITY_RETURNING;
    }
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


function addPoint( p, pos )
{
    var newMarker;

    // Break line in two
    if ( typeof pos != 'undefined' )
    {
        points.splice( pos, 0, p );
        endPoint = ( endPoint == 0 ) ? 0 : points.length - 1;
        newMarker = insertMarkerAt( p, pos );
        indexMarkers();
    }
    else if ( endPoint == 0
                && points.length > 1
                )
    {
        // Prepend point to line
        points.unshift( p );
        newMarker = addMarker( p, true );
        indexMarkers();
    }
    else
    {
        // Add new point to the end
        points.push( p );
        endPoint = points.length - 1;
        newMarker = addMarker( p );
    }

    // Start drag if possible
    touchStart( newMarker );
}

function clearAllPoints()
{
    points = [];
    removeMarkers();
    app.clearCanvas();

    return false;
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
    context.drawImage( app.pointStatesCanvas, 0, iconY, 20, 20, x + origin.x - 10, y + origin.y - 10, 20, 20 );


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









/**
 * Tutorial
 */

var Tutorial = function()
{
    var pos = 0;
    var instructions = { 'new': [], 'share': [] };
    this.mode = 'new';

    this.init = function( mode )
    {
        this.mode = ( mode == strings.ACTVITY_NEW ) ? 'new' : 'share' ;

        // Store all instructions by type
        var elements = document.querySelectorAll( '#dialogue ul' );
        for ( var i = 0; i < elements.length; i++ )
        {
            var el = elements[ i ];
            var id = el.id.split( '-' )[1];
            var list = el.getElementsByTagName( 'li' );
            for ( var j = 0, max = list.length; j < max; j++ )
            {
                instructions[ id ].push( list[ j ].innerHTML );
            }
        }

        document.getElementById( 'dialogue' ).innerHTML = '';
        document.getElementById( 'dialogue' ).style.display = 'block';
    };

    this.next = function()
    {
        if ( pos < instructions[ this.mode ].length + 1 )
        {
            document.querySelector( '#dialogue' ).innerHTML = ( pos < instructions[ this.mode ].length ) ? instructions[ this.mode ][ pos ] : '' ;
            pos++;
        }
    };

    this.reset = function()
    {
        pos = 0;
    }
};













/**
 * Implementation + init - move this to containing page?
 */

var app;

init();

function init()
{
    /*
     initialize (new)
     initialize (share)

     reset
     toggle - settings - on/off
     toggle - grid - on/off
     toggle - snap - on/off
     tool - pen_add
     tool - pen_delete


     pen tool - add
     pen tool - delete


     add point
     split line
     remove point


     share - open/close ??
     info - open/close ??
     */

    app = new ParabolicLineDesigns();
    app.trackEvent = function( action, label, value, noninteraction )
    {
        // alert( 'Track event: ' + action );
        if ( trackEvent )
            trackEvent( 'Parabolic', action, label, value, noninteraction );
    };
    app.init();

    var activity = ( app.modeActivity == strings.ACTVITY_NEW ) ? 'New' : 'Share' ;
    app.trackEvent( 'Initialize', activity, null, true );
}














////// GLOBAL STUFF //////

/**
 * Move to global
 * @param category
 * @param action
 * @param label
 * @param value
 * @param noninteraction
 */

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

