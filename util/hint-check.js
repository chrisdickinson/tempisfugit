var nodejshint = require( './nodejshint.js' ).test,

files = [
  // Test lib
  'lib/index.js',
  'lib/int.js',
  'lib/object.js',
  'lib/ofs.js',
  'lib/oid.js',
  'lib/ref.js',
  'lib/repository.js',

  // Test odb
  'lib/odb/index.js',
  'lib/odb/loose.js',
  'lib/odb/pack.js',

  // Test types
  'lib/types/blob.js',
  'lib/types/commit.js',
  'lib/types/ext1.js',
  'lib/types/ext2.js',
  'lib/types/index.js',
  'lib/types/ofsdelta.js',
  'lib/types/ref.js',
  'lib/types/refdelta.js',
  'lib/types/tag.js',
  'lib/types/tree.js',

  // Test examples
  'example/test.js'
];

nodejshint( files, function( failures ) {
  if( !failures ) {
    process.exit( 0 );
  }
  else {
    process.exit( 1 );
  }
});
