<?php

require_once 'Syncretinal.php';
$core = new Syncretinal();
$core->setPageId( 'lab.parabolic_line_designs' );

?>
<!DOCTYPE html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!-->
<html class="no-js" xmlns="http://www.w3.org/1999/html"> <!--<![endif]-->
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>Parabolic line designs - Syncretinal</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width">

        <?=$core->get('openGraph')?>

        <link rel="stylesheet" href="css/normalize.css">
        <link rel="stylesheet" href="css/main.css">
        <link rel="stylesheet" type="text/css" media="screen" href="../../media/css/core.css" />
        <link rel="stylesheet" type="text/css" media="screen" href="css/parabolic_line_design.css" />

        <script src="js/vendor/modernizr-2.6.2.min.js"></script>
        <script src="js/vendor/jquery-1.9.0.min.js"></script>
        <script type="text/javascript" src="../../media/js/core.js"></script>

        <?=$core->get('analytics')?>
    </head>
    <body class="min">
        <!--[if lt IE 7]>
            <p class="chromeframe">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> or <a href="http://www.google.com/chromeframe/?redirect=true">activate Google Chrome Frame</a> to improve your experience.</p>
        <![endif]-->


        <header>
            <?=$core->get('nav')?>
            <h1><span>Parabolic line designs</span></h1>
        </header>


        <!-- Lab begins -->
        <form name="settings">

            <div class="mode">
                <label class="half on" id="draw">
                    <span><input type="radio" name="mode" value="draw" checked="checked" />Draw</span>
                </label>
                <label class="half" id="delete">
                    <span><input type="radio" name="mode" value="delete" />Delete</span>
                </label>
            </div>

            <ul id="settings">
                <li>Settings</li>
                <ul>
                    <li><label><input type="checkbox" id="grid" /> <u>G</u>rid</label></li>
                    <li><label><input type="checkbox" id="snap" /> <u>S</u>nap</label></li>
                    <li><label id="reset"><u>R</u>eset</label></li>
                </ul>
            </ul>

            <button id="about">?</button>
            <button id="share">Share</button>

        </form>



        <div id="markers"></div>
        <div id="stage">
            <canvas width="200" height="200" class="layer" id="gradient"></canvas>
            <canvas width="200" height="200" class="layer" id="lines"></canvas>
            <canvas width="200" height="200" class="layer" id="debug"></canvas>
        </div>


        <div id="overlay">
            <article>
                <section id="aboutSection">
                    <h2>About</h2>
                    <p><strong>Drawing parabolic line designs is easy: connect three or more points with straight lines, then interpolate between those to form the rough outline of a <a href="http://en.wikipedia.org/wiki/Parabola">parabola</a>.</strong></p>
                    <p>Lots of us made them in elementary school using a pencil, ruler, and graph paper. This nostalgia must be what's reminded me of them over the years, reworking a simple interactive demo each time.</p>
                    <p>Since touch screens are a given on new phones, it was time to rewrite the old Flash version (itself reworked from an earlier Java applet) using JavaScript and Canvas, and add support for mobile. It was also a good opportunity to allow points to be dragged around, and add a snappy grid for more precise designs.</p>
                    <p>That said, drawing <a href="http://www.google.com/search?hl=en&site=&q=parabolic+line+designs">parabolic line designs</a> the old-school way is still a good way to go!</p>
                </section>

                <section id="shareSection">
                    <h2>Share</h2>
                    <!-- p>Post this to:</p>
                    <p style="text-align: center;">[Facebook] &nbsp; [Twitter] &nbsp; [Google+]</p -->
                    <p>Copy and paste the link below to share your design:</p>
                    <p><textarea id="shareUrl" readonly="readonly" rows="2"></textarea></p>
                </section>

                <nav><a href="#close">Close<span>X</span></a></nav>
            </article>
        </div>


        <div id="dialogue">
            <ul id="tutorialNew">
                <li>Tap anywhere to start</li>
                <li>Tap again to draw a line</li>
                <li>One more time to draw a parabola</li>
                <li>Move the points around, or keep drawing!</li>
            </ul>
            <!--
            <ul id="tutorialShare">
                <li>Tap anywhere to draw a new point</li>
                <li>You can move the points around, or <em>Reset</em> to start from scratch</li>
            </ul>
            -->
        </div>

        <script type="text/javascript" src="js/parabolic_line_designs.js"></script>
        <!-- Lab ends -->

        <?=$core->get('footer')?>

    </body>
</html>