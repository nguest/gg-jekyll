var container;

var camera, scene, renderer;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var particles, uniforms;
var colors, positions, sizes, geometry1;

var PARTICLE_SIZE = 50;

var raycaster, intersects;
var mouse, INTERSECTED;

(function(){
  init();
})()

function init() {

  //gallery
  document.querySelector('.gallery-container-toggle').addEventListener('click',function(e){
    console.log('hello');
    document.body.classList.toggle('gallery-active');
  })


  //create threejs element
  var portfolioPage = document.getElementById('portfolio')
  var threeElement = document.createElement( 'div' );
  container = portfolioPage.appendChild( threeElement );
  //document.body.appendChild( container );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.z = 100;
  camera.lookAt(0,0,0);


  // scene

  scene = new THREE.Scene();

  scene.fog = new THREE.FogExp2( 0xaaaaaa, 0.009 );

  // lights
  var ambient = new THREE.AmbientLight( 0xaaaaaa );
  scene.add( ambient );

  var directionalLight = new THREE.DirectionalLight( 0xffeedd );
  directionalLight.position.set( 50, 0, 100 );
  scene.add( directionalLight );


  var light2	= new THREE.DirectionalLight( 0xFAEDFF, 1 );

  light2.shadow.camera.left = -60; // or whatever value works for the scale of your scene
  light2.shadow.camera.right = 60;
  light2.shadow.camera.top = 60;
  light2.shadow.camera.bottom = -60;
  light2.shadow.camera.near = 1;
  light2.shadow.camera.far = 500;
  light2.shadow.camera.fov = 130;
  light2.shadow.mapSize.width = 2048;
  light2.shadow.mapSize.height = 2048;

  light2.castShadow = true;
  light2.shadow.darkness = 0.5;
  light2.position.set(0,100,60);
  light2.scale.set(100,100,100);
  light2.target.position.set( 0, 0, 0 );

  light2.shadow.camera.position.set( 0, 100, -40 );
  scene.add(light2.target);

  scene.add(light2);
  var helper = new THREE.CameraHelper( light2.shadow.camera );
  scene.add( helper );

  // renderer

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( 0xffffff, 0 );
  container.appendChild( renderer.domElement );
  renderer.shadowMap.enabled = true;

  //////////////////////document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  window.addEventListener( 'resize', onWindowResize, false );

  // materials //
  var material	= new THREE.MeshPhongMaterial({
    color		: 0xcccccc,
    wireframe:true,
    fog: true,
    wireframeLinewidth: 10

  });
  var lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 5
  });

  var discMaterial = new THREE.MeshPhongMaterial( {
    color: 0xffffff,
    shininess: 100,
    emissive:  0xffffff,
  });

  var shaderMaterial = new THREE.ShaderMaterial( {
    uniforms: {
      color:   { value: new THREE.Color( 0xffffff ) },
      //texture: { value: new THREE.TextureLoader().load( "//threejs.org/examples/textures/sprites/disc.png" ) }
      texture: { value: new THREE.TextureLoader().load( "./assets/webpage.jpg" ) }
    },
    vertexShader: document.getElementById( 'vertexshader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
    alphaTest: 0.9,

  } );

  // model

  var scale = 30;
  var offsetY = 40;
  var positions, colors, sizes;

  var loader = new THREE.OBJLoader();

  var galleryItems = [0,1,2,3];

  loader.load( './assets/headframe.obj', function ( object ) {

    object.traverse( function ( child ) {

      if ( child instanceof THREE.Mesh ) {

        child.material = material
        child.material.color.setHex( 0xff0000 )
        child.castShadow = true;
        //child.receiveShadow = true;

        positions = new Float32Array(galleryItems.length * 3)
        colors = new Float32Array(galleryItems.length * 3);
        sizes = new Float32Array(galleryItems.length * 2);

        //for (var i = 2013; i < child.geometry.attributes.position.count; i+=3)
        for (var i = 438; i < 450; i+=3) {

            var x = child.geometry.attributes.position.array[i];
            var y = child.geometry.attributes.position.array[i+1]
            var z = child.geometry.attributes.position.array[i+2]
            var start = new THREE.Vector3( x*scale, y*scale+offsetY, z*scale )
            var end = new THREE.Vector3(x*scale*2, (y*scale)*2+offsetY, z*scale*2 )

            var lineGeometry = new THREE.Geometry();
            lineGeometry.vertices.push(start);
            lineGeometry.vertices.push(end);
            var line = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(line);

            var sphereGeometry = new THREE.SphereBufferGeometry(1,1,10,10);
            var sphere = new THREE.Mesh( sphereGeometry, discMaterial )
            sphere.position.set(x*scale, y*scale+offsetY, z*scale);
            scene.add(sphere);

            //console.log(end);
            end.toArray(positions, i-438);

            var color = new THREE.Color();
            color.setHSL( 0.01 + 0.1, 1.0, 0.5 )
            for (var j=0; j < colors.length; j++) {
              color.toArray( colors, j);
            }

            for (var j=0; j < sizes.length; j++) {
              sizes[ j ] = PARTICLE_SIZE;
            }
        }

      }

    });

    object.position.y = offsetY;
    object.scale.set(scale,scale,scale)
    object.castShadow = true;
    object.receiveShadow = true;
    scene.add( object );

    geometry1 = new THREE.BufferGeometry();
    geometry1.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry1.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
    geometry1.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
    //
    // console.log(geometry1);
    // //
    particles = new THREE.Points( geometry1, shaderMaterial );
    scene.add( particles );

    var planeGeometry = new THREE.PlaneBufferGeometry( 1000, 1000, 32 );
    //var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
    var plane = new THREE.Mesh( planeGeometry, discMaterial);
    plane.rotation.x = -Math.PI/2
    plane.position.set(0,-40,0);
    plane.receiveShadow = true;
    scene.add( plane );


    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();




    animate();


  });






}

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {
  //event.preventDefault();

  mouseX = ( event.clientX - windowHalfX ) / 4;
  mouseY = ( event.clientY - windowHalfY ) / 4;

  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  //console.log(mouse);
}

//

function animate() {

  requestAnimationFrame( animate );
  render();

}

function render() {

  camera.position.x += ( mouseX - camera.position.x ) * 0.05;
  camera.position.y += ( - mouseY - camera.position.y ) * 0.05;

  camera.lookAt( scene.position );


  var geometry = particles.geometry;
  var attributes = geometry.attributes;

  raycaster.setFromCamera( mouse, camera );

  intersects = raycaster.intersectObject( particles );
  if ( intersects.length > 0 ) {

    if ( INTERSECTED != intersects[ 0 ].index ) {

      attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE;

      INTERSECTED = intersects[ 0 ].index;

      document.body.style.cursor = 'pointer'
      attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE * 1.7;
      attributes.size.needsUpdate = true;
      document.addEventListener('click', toggleGallery);

    }

  } else if ( INTERSECTED !== null ) {
    attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE;
    attributes.size.needsUpdate = true;
    INTERSECTED = null;

  }

  function toggleGallery() {
    document.body.classList.add('gallery-active');
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener('click', toggleGallery);

  }

  renderer.render( scene, camera );

}
