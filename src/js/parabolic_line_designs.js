
/**
 * @author scottwwh / http://syncretinal.com
 */


// Keep around for impl until classes use app context
var app;

var strings = {};
strings.RESET               = "Clear all points and start over?";
strings.DRAW                = "draw";
strings.DELETE              = "delete";
strings.ACTVITY_NEW         = 'activityNew';
strings.ACTVITY_RETURNING   = 'activityReturning';


/**
 * Parabolic Line Designs controls
 */

var Controls = function()
{
    var keysActive = {};

    this.init = function()
    {
        window.onkeydown = this.onKeyDown.bind(this);
        window.onkeyup = this.onKeyUp.bind(this);

        // Update to reflect default state
        document.getElementById( 'grid' ).checked = app.grid;

        // Controls
        document.querySelector( '#settings li' ).onclick = this.toggleSettings;
        document.getElementById( 'grid' ).onchange = this.onChangeSetting.bind(this);
        document.getElementById( 'snap' ).onchange = this.onChangeSetting.bind(this);

        document.getElementById( 'reset' ).onclick = this.onChangeSetting.bind(this);
        document.getElementById( 'mode' ).onclick = this.onChangeSetting.bind(this);
        document.getElementById( 'draw' ).onclick = this.onChangeSetting.bind(this);
        document.getElementById( 'delete' ).onclick = this.onChangeSetting.bind(this);
        document.getElementById( 'share' ).onclick = this.onChangeSetting.bind(this);
        document.getElementById( 'about' ).onclick = this.onChangeSetting.bind(this);

        document.querySelector( 'header' ).addEventListener( 'mousedown', this.onClickReserved.bind(this) );
        document.querySelector( 'form[name="settings"]' ).addEventListener( 'mousedown', this.onClickReserved.bind(this) );
        document.querySelector( 'form[name="settings"]' ).addEventListener( 'touchstart', this.onClickReserved.bind(this) );

        // Overlay
        document.querySelector( 'a[href="#close"]' ).onclick = this.closeOverlay.bind(this);
        document.getElementById( 'overlay' ).onclick = this.closeOverlay;
        document.querySelector( '#overlay article' ).onclick = function( e ) { e.stopImmediatePropagation(); };

        document.getElementById( 'shareUrl' ).onclick = function( e ) { e.currentTarget.select(); };
    };

    this.onKeyDown = function( e )
    {
        keysActive[ e.which ] = true;
    };

    this.onKeyUp = function( e )
    {
        if ( typeof keysActive[ e.which ] === 'undefined' )
            return;

        if ( e.which == 27 ) // Esc
        {
            this.closeOverlay();
        }
        else
        {
            var char = String.fromCharCode( e.which );
            switch( char )
            {
                case 'G':
                    this.toggleGrid();
                    break;

                case 'S':
                    this.toggleSnap();
                    break;

                case 'M':
                    this.changeMode();
                    break;

                case 'R':
                    if ( ! keysActive[ 17 ] ) // Ctrl-R
                        app.reset();
                    break;

                default:
                    // console.log( 'No action assigned to', char );
                    break;
            }
        }

        keysActive[ e.which ] = false;
    };

    this.onClickReserved = function( e )
    {
        e.stopImmediatePropagation();
    };

    this.onChangeSetting = function( e )
    {
        switch( e.currentTarget.id )
        {
            case 'grid':
                this.toggleGrid();
                break;

            case 'snap':
                this.toggleSnap();
                break;

            case 'reset':
                app.reset();
                break;

            case 'share':
            case 'about':
                this.openOverlay( e.currentTarget.id );
                break;

            case 'mode':
                this.toggleMode();
                break;

            case 'draw':
            case 'delete':
                this.changeMode( e );
                break;
        }

        return false;
    };

    this.toggleSettings = function()
    {
        var el = document.querySelector( '#settings ul' );
        el.style.display = ( el.style.display == 'block' ) ? 'none' : 'block' ;
    };

    this.toggleGrid = function()
    {
        app.grid = ! app.grid ;

        var visibility = ( app.grid ) ? 'visible' : 'hidden' ;
        document.getElementById("lines-grid").style.visibility = visibility;

        document.getElementById( 'grid' ).checked = app.grid;
    };

    this.toggleSnap = function()
    {
        app.snap = ! app.snap ;

        document.getElementById( 'snap' ).checked = app.snap;
    };

    this.toggleMode = function()
    {
        app.modePen = ( app.modePen == strings.DRAW ) ? strings.DELETE : strings.DRAW ;

        this.updatePenIcons();
    };

    this.changeMode = function( e )
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
            this.toggleMode();
        }

        this.updatePenIcons();
    };

    this.updatePenIcons = function()
    {
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
    };


    /** MENU **/

    this.openOverlay = function( section )
    {
        app.isOverlayOpen = true;

        // console.log( 'Show', section );
        var sections = document.getElementById( 'overlay' ).getElementsByTagName( 'section' );
        sections[ 0 ].style.display = 'none';
        sections[ 1 ].style.display = 'none';

        if ( section == 'share' )
        {
            document.getElementById( 'shareUrl' ).value = app.getShareUrl();
        }

        document.getElementById( section + 'Section' ).style.display = 'block';
        document.getElementById( 'overlay' ).style.display = 'block';
        return false;
    };

    this.closeOverlay = function(e)
    {
        app.isOverlayOpen = false;

        // Prevent background from being clicked
        if ( e )
        {
            console.log( 'stop default?' );
            e.stopImmediatePropagation();
        }

        var sections = document.getElementById( 'overlay' ).getElementsByTagName( 'section' );
        sections[ 0 ].style.display = 'none';
        sections[ 1 ].style.display = 'none';

        document.getElementById( 'overlay' ).style.display = 'none';
        return false;
    };
};


/**
 * Parabolic Line Designs app
 */

var ParabolicLineDesigns = function( debug )
{
    this.debug = debug || false ;
    // console.log( this.debug );

    // Controls
    this.grid = true;
    this.snap = false;

    this.modePen = strings.DRAW;
    this.modeActivity = strings.ACTVITY_NEW;


    this.tutorial = null;
    this.controls = null;


    this.pointStatesCanvas;

    this.linesCanvas;
    this.linesContext;
    this.debugCanvas;
    this.debugContext;




    this.origin = { x: 0, y: 0 };
    this.points = [];
    this.spacing = 25; // Grid lines
    this.intervals = 20; // Interpolations


    this.moving = false;
    this.movingDiv;
    this.endPoint = 0;
    this.currentPoint = null;

    this.isTouchingCanvas = false;
    this.isOverlayOpen = false;



    this.init = function()
    {
        this.controls = new Controls();
        this.controls.init();

        this.linesCanvas = document.getElementById( 'lines' );
        this.linesContext = this.linesCanvas.getContext( '2d' );

        this.debugCanvas = document.getElementById( 'debug' );
        this.debugContext = this.debugCanvas.getContext( '2d' );

        this.origin.x = this.linesCanvas.width * 0.5;
        this.origin.y = this.linesCanvas.height * 0.5;


        this.drawPointStates();
        this.drawGrid();
        this.initPointsInUri();
        this.resize(); // Draw all points/markers/debug


        var label = ( this.modeActivity == strings.ACTVITY_NEW ) ? 'New' : 'Share' ;
        this.trackEvent( 'Initialize', label, this.points.length, true );


        // Handlers

        window.addEventListener( 'mousedown', this.touchCanvasStartHandler.bind(this) );
        window.addEventListener( 'touchstart', this.touchCanvasStartHandler.bind(this) );

        window.addEventListener( 'mouseup', this.touchCanvasEndHandler.bind(this) );
        window.addEventListener( 'touchend', this.touchCanvasEndHandler.bind(this) );

        window.addEventListener( 'mousemove', this.moveMarkerHandler.bind(this) );
        window.addEventListener( 'touchmove', this.moveMarkerHandler.bind(this) );

        window.addEventListener( 'resize', this.resize.bind(this) );


        this.tutorial = new Tutorial();
        this.tutorial.setMode( this.modeActivity );
        this.tutorial.init();
        this.tutorial.next();
    };

    this.initPointsInUri = function()
    {
        if ( document.location.hash != '' )
        {
            var params = {};
            var hash = document.location.hash.substr( 1 ).split( '&' );

            for ( var i = 0; i < hash.length; i++ )
            {
                var kv = hash[ i ].split( '=' );
                if ( kv.length == 1 )
                    continue;

                params[ kv[ 0 ] ] = kv[ 1 ];
            }

            if ( typeof( params.p ) === "undefined" )
                return;

            var sharedPoints = params.p.split( '|' );
            if ( sharedPoints.length == 0 )
            {
                alert( 'No this.points!' );
                return;
            }

            var point = [];
            for ( var j = 0; j < sharedPoints.length; j++ )
            {
                point = sharedPoints[ j ].split( ',' );
                this.addPoint( { x: Number( point[0] ), y: Number( point[1] ) } );
            }

            this.modeActivity = strings.ACTVITY_RETURNING;
        }
    };

    this.reset = function()
    {
        if ( confirm( strings.RESET ) )
        {
            this.points = [];
            this.removeMarkers();
            this.clearCanvas();

            if ( ! this.tutorial.hasShownNew )
            {
                this.tutorial.setMode( strings.ACTVITY_NEW );
                this.tutorial.reset();
                this.tutorial.next();
            }
        }
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

        this.origin.x = this.linesCanvas.width * 0.5;
        this.origin.y = this.linesCanvas.height * 0.5;

        elems = document.querySelectorAll( '.marker' );
        for ( var j = 0; j < elems.length; j++ )
        {
            elems[j].style.top = this.points[j].y + this.origin.y + 'px';
            elems[j].style.left = this.points[j].x + this.origin.x + 'px';
        }

        this.clearCanvas();
        this.drawGrid();
        this.drawAllPoints();
    };


    /** HANDLERS **/

    this.touchCanvasStartHandler = function( e )
    {
        e.preventDefault();

        if ( this.isTouchingCanvas || this.isOverlayOpen )
            return;
        else
            this.isTouchingCanvas = true;

        if ( this.moving || this.modePen == strings.DELETE ) return;

        var newMarker;
        var target = ( e.type == 'touchstart' ) ? e.touches[0] : e ;
        var p = { x: target.pageX - this.origin.x, y: target.pageY - this.origin.y };
        var pTest = { x: target.pageX, y: target.pageY };
        var line;

        if ( this.isTouchingLine( pTest ) )
            line = this.getCurrentLine( pTest );

        if ( this.snap )
            p = this.snapPointToGrid( p );

        newMarker = this.addPoint( p, line );

        this.clearCanvas();
        this.drawAllPoints();

        this.tutorial.next();
        this.trackEvent( 'Point', 'Add', this.points.length );

        // Start drag if possible
        this.touchMarker( newMarker );
    };

    this.touchCanvasEndHandler = function(e)
    {
        // console.log(e.type);
        this.isTouchingCanvas = false;
        this.moving = false; // Fix touchscreen prob with adding new points
    };

    this.touchStartHandler = function( e )
    {
        e.preventDefault();

        this.tutorial.next();
        this.touchMarker( e.currentTarget );
    };

    this.touchEndHandler = function( e )
    {
        e.preventDefault();

        this.currentPoint = null;
        this.moving = false;

        this.clearCanvas();
        this.drawAllPoints();
    };
    
    this.moveMarkerHandler = function( e )
    {
        if ( this.moving )
        {
            this.moveMarker( e );
            return;
        }
        else
        {
            var p = { x: e.pageX, y: e. pageY };
        }

        if ( this.points.length > 1 )
        {
            if ( this.isTouchingLine( p )
                    && this.modePen == strings.DRAW
                    )
            {
                document.body.style.cursor = "pointer";
            }
            else
            {
                document.body.style.cursor = "default";
            }
        }
    };


    /** GETTERS AND SETTERS **/

    this.getShareUrl = function()
    {
        var url = document.location.href;
        if ( url.indexOf( '#' ) > -1 ) url = url.substr( 0, url.indexOf( '#' ) );

        if ( this.points.length > 0 )
        {
            var arr = [];
            for ( var i = 0; i < this.points.length; i++ )
            {
                arr.push( this.points[i].x + ',' + this.points[i].y );
            }
            url += '#v=1&p=' + arr.join( '|' );
        }
        return url;
    };


    /** MARKERS **/

    this.addMarker = function( pt, pos )
    {
        pos = ( typeof pos === 'undefined' ) ? this.endPoint : pos ;

        var div = document.createElement( 'div' );
        div.className = 'marker';
        div.setAttribute( 'data', pos );
        div.style.top = pt.y + this.origin.y + 'px';
        div.style.left = pt.x + this.origin.x + 'px';

        div.addEventListener( 'mousedown', this.touchStartHandler.bind(this) );
        div.addEventListener( 'touchstart', this.touchStartHandler.bind(this) );

        div.addEventListener( 'mouseup', this.touchEndHandler.bind(this) );
        div.addEventListener( 'touchend', this.touchEndHandler.bind(this) );

        // Prepend
        if ( pos == 0 )
        {
            document.getElementById( 'markers' ).insertBefore( div, document.getElementById( 'markers' ).firstChild );
        }
        // Append
        else if ( pos == this.points.length - 1 )
        {
            document.getElementById( 'markers' ).appendChild( div );
        }
        // Split line
        else
        {
            document.getElementById( 'markers' ).insertBefore( div, document.getElementById( 'markers' ).childNodes[ pos ] );
        }

        return div;
    };

    this.indexMarkers = function()
    {
        var markers = document.querySelectorAll( '.marker' );
        for ( var i = 0; i < markers.length; i++ )
        {
            markers[ i ].setAttribute( 'data', i );
        }
    };

    this.removeMarkers = function()
    {
        var markers = document.querySelectorAll( '.marker' );
        for ( var i = 0; i < markers.length; i++ )
        {
            document.getElementById( 'markers' ).removeChild( markers[ i ] );
        }
    };

    this.removeMarker = function( num )
    {
        document.getElementById( 'markers' ).removeChild( document.getElementById( 'markers' ).children[ num ] );
    };

    this.touchMarker = function( elem )
    {
        var id = parseInt( elem.getAttribute( 'data' ), 10 );

        if ( this.modePen == strings.DELETE )
        {
            // console.log( id );
            this.points.splice( id, 1 );
            this.removeMarker( id );
            this.indexMarkers();

            this.endPoint = ( this.endPoint == 0 ) ? 0 : this.points.length - 1 ;

            this.clearCanvas();
            this.drawAllPoints();
        }
        else
        {
            this.movingDiv = elem;
            this.moving = true;

            this.currentPoint = id;

            // Update active point if applicable
            if ( this.endPoint != id
                    && ( id == 0 || id == this.points.length - 1 )
                    )
            {
                this.endPoint = id;
            }

            this.clearCanvas();
            this.drawAllPoints();
        }
    };

    this.moveMarker = function( e )
    {
        e.preventDefault();

        var p = { x: e.pageX - this.origin.x, y: e. pageY - this.origin.y };

        if ( e.type == 'touchmove' )
        {
            p.x = e.touches[ 0 ].pageX - this.origin.x;
            p.y = e.touches[ 0 ].pageY - this.origin.y;
        }

        if ( this.snap ) p = this.snapPointToGrid( p );

        this.movingDiv.style.top = p.y + this.origin.y + 'px';
        this.movingDiv.style.left = p.x + this.origin.x + 'px';

        // Update point
        this.points[ this.movingDiv.getAttribute( 'data' ) ] = p;

        this.clearCanvas();
        this.drawAllPoints();
    };


    /** LINES **/

    // Get the CanvasPixelArray from the given coordinates and dimensions.
    this.getCurrentLine = function( p )
    {
        return this.debugContext.getImageData( p.x, p.y, 1, 1 ).data[ 0 ];
    };

    this.isTouchingLine = function( p )
    {
        // console.log( p );
        var imgd = this.debugContext.getImageData( p.x, p.y, 1, 1 );
        return ( imgd.data[0] > 0 );
    };


    /** POINTS **/

    this.snapPointToGrid = function( p )
    {
        var realX = Math.abs( p.x );
        var diffX = realX % this.spacing;
        if ( Math.abs( diffX ) < this.spacing * 0.5 )
        {
            realX -= diffX;
        }
        else
        {
            realX += this.spacing - diffX;
        }
        p.x = ( p.x < 0 ) ? realX * -1 : realX ;


        var realY = Math.abs( p.y );
        var diffY = realY % this.spacing;
        if ( Math.abs( diffY ) < this.spacing * 0.5 )
        {
            realY -= diffY;
        }
        else
        {
            realY += this.spacing - diffY;
        }
        p.y = ( p.y < 0 ) ? realY * -1 : realY ;


        return p;
    };

    this.addPoint = function( p, pos )
    {
        // Break line in two
        if ( typeof pos !== 'undefined' )
        {
            this.points.splice( pos, 0, p );
            this.endPoint = ( this.endPoint == 0 ) ? 0 : this.points.length - 1;
        }
        else
        {
            if ( this.endPoint == 0 )
            {
                // Prepend
                this.points.unshift( p );
            }
            else
            {
                // Append
                this.points.push( p );
                this.endPoint = this.points.length - 1;
            }

            pos = this.endPoint;
        }

        var marker = this.addMarker( p, pos );
        this.indexMarkers();

        // Return marker for handling if necessary
        return marker;
    };

    this.drawAllPoints = function()
    {
        for ( var i = 0; i < this.points.length; i++ )
        {
            this.drawPoint( i );
        }
    };


    /** RENDERER **/

    this.clearCanvas = function()
    {
        // Various ways to force canvas to be cleared
        if ( true )
        {
            this.linesContext.clearRect( 0, 0, this.linesCanvas.width, this.linesCanvas.height );
            this.debugContext.clearRect( 0, 0, this.debugCanvas.width, this.debugCanvas.height );
        }
        else
        {
            this.linesCanvas.width = this.linesCanvas.width;
            this.debugCanvas.width = this.debugCanvas.width;
        }
    };

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

        if ( this.debug )
        {
            // document.body.appendChild( this.pointStatesCanvas );
            document.body.appendChild( this.debugCanvas );
        }
    };

    this.drawCircle = function( context, style, x, y, radius, stroke )
    {
        stroke = stroke || false;

        if ( stroke )
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
        for ( var i = 0; i < this.origin.y / this.spacing; i++ )
        {
            context.lineWidth = ( i * this.spacing % 100 == 0 ) ? 1 : 0.5 ;

            context.beginPath();
            context.moveTo( 0, this.origin.y - this.spacing * i );
            context.lineTo( gridCanvas.width, this.origin.y - this.spacing * i );
            context.moveTo( 0, this.origin.y + this.spacing * i );
            context.lineTo( gridCanvas.width, this.origin.y + this.spacing * i );
            context.stroke();
            context.closePath();
        }

        // X grid lines
        for ( var j = 0; j < this.origin.x / this.spacing; j++ )
        {
            context.lineWidth = ( j * this.spacing % 100 == 0 ) ? 1 : 0.5 ;

            context.beginPath();
            context.moveTo( this.origin.x - this.spacing * j, 0 );
            context.lineTo( this.origin.x - this.spacing * j, gridCanvas.height );
            context.moveTo( this.origin.x + this.spacing * j, 0 );
            context.lineTo( this.origin.x + this.spacing * j, gridCanvas.height );
            context.stroke();
            context.closePath();
        }

        // X/Y axis lines
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo( 0, this.origin.y );
        context.lineTo( this.linesCanvas.width, this.origin.y );
        context.moveTo( this.origin.x, 0 );
        context.lineTo( this.origin.x, this.linesCanvas.height );
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

    this.drawPoint = function( num )
    {
        var x = this.points[ num ].x;
        var y = this.points[ num ].y;


        // Draw point icons
        var iconY = 0;
        if ( num == this.endPoint )
        {
            iconY = ( num == this.currentPoint ) ? 40 : 0 ;
        }
        else
        {
            iconY = ( num == this.currentPoint ) ? 60 : 20 ;
        }
        this.linesContext.drawImage( this.pointStatesCanvas, 0, iconY, 20, 20, x + this.origin.x - 10, y + this.origin.y - 10, 20, 20 );


        // Draw lines
        this.linesContext.strokeStyle = 'gold';
        this.linesContext.fillStyle = 'gold';
        this.linesContext.lineWidth = 1;
        if ( num > 0 )
        {
            var pt1 = this.points[ num - 1 ];

            if ( num > 1 )
            {
                var pt2 = this.points[ num - 2 ];

                var d1 = { x: ( x - pt1.x ) / this.intervals,
                    y: ( y - pt1.y ) / this.intervals
                };

                var d2 = { x: ( pt1.x - pt2.x ) / this.intervals,
                    y: ( pt1.y - pt2.y ) / this.intervals
                };

                // Parabolize..
                for ( var i = 1; i < this.intervals + 1; i++ )
                {
                    this.linesContext.beginPath();
                    this.linesContext.moveTo( pt1.x + d1.x * i + this.origin.x, pt1.y + d1.y * i + this.origin.y );
                    this.linesContext.lineTo( pt2.x + d2.x * i + this.origin.x, pt2.y + d2.y * i + this.origin.y );
                    this.linesContext.stroke();
                    this.linesContext.closePath();
                }
            }


            var grad;
            if ( num == this.currentPoint )
            {
                grad = this.linesContext.createLinearGradient( pt1.x + this.origin.x, pt1.y + this.origin.y,
                                                                x + this.origin.x, y + this.origin.y
                                                                );
                grad.addColorStop( 1, "white" );
                grad.addColorStop( 0, "gold" );
                this.linesContext.strokeStyle = grad;
                this.linesContext.lineWidth = 2.5;
            }
            else if ( this.currentPoint != null )
            {
                if ( ( this.currentPoint == 0 && num == 1 )
                        || ( num == this.currentPoint + 1 && this.currentPoint != 0 )
                        )
                {
                    grad = this.linesContext.createLinearGradient( x + this.origin.x, y + this.origin.y,
                                                                    pt1.x + this.origin.x, pt1.y + this.origin.y
                                                                    );
                    grad.addColorStop( 1, "white" );
                    grad.addColorStop( 0, "gold" );
                    this.linesContext.strokeStyle = grad;
                    this.linesContext.lineWidth = 2.5;
                }
            }


            // Draw line between first two points
            this.linesContext.beginPath();
            this.linesContext.moveTo( pt1.x + this.origin.x, pt1.y + this.origin.y );
            this.linesContext.lineTo( x + this.origin.x, y + this.origin.y );
            this.linesContext.stroke();
            this.linesContext.closePath();


            // Refresh canvas hitmap
            this.debugContext.strokeStyle = 'rgb( ' + num + ', 0, 0 )';
            this.debugContext.lineWidth = 20;
            this.debugContext.beginPath();
            this.debugContext.moveTo( pt1.x + this.origin.x, pt1.y + this.origin.y );
            this.debugContext.lineTo( x + this.origin.x, y + this.origin.y );
            this.debugContext.stroke();
            this.debugContext.closePath();
        }
    };


    /** CONVENIENCE **/

    this.trackEvent = function( action, label, value, noninteraction ) {};
};


/**
 * Parabolic Line Designs tutorial
 */

var Tutorial = function()
{
    var pos = 0;
    var instructions = { 'new': [], 'share': [] };
    this.hasShownNew = false;
    this.mode = 'new';

    this.init = function()
    {
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

        document.getElementById( 'dialogue' ).innerHTML = '<span></span>';
        document.getElementById( 'dialogue' ).style.display = 'block';
    };

    this.setMode = function( mode )
    {
        this.mode = ( mode == strings.ACTVITY_NEW ) ? 'new' : 'share' ;

        if ( mode == strings.ACTVITY_NEW )
            this.hasShownNew = true;
    };

    this.next = function()
    {
        if ( pos < instructions[ this.mode ].length )
        {
            if ( pos == 0 )
                document.querySelector( '#dialogue' ).className= '';

            document.querySelector( '#dialogue span' ).innerHTML = instructions[ this.mode ][ pos ];
            document.querySelector( '#dialogue span' ).className= 'box-shadow';
            pos++;

            app.trackEvent( 'Tutorial', 'Update (' + this.mode + ')', pos );
        }
        else
        {
            document.querySelector( '#dialogue' ).className= 'hidden';
        }
    };

    this.reset = function()
    {
        pos = 0;
    }
};
