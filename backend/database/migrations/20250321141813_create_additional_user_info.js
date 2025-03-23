exports.up = function(knex) {
 return knex.schema.alterTable('users', function(table) {
   table.string('phone').nullable();        // New phone column
   table.string('gender').nullable();      // New gender column
   table.string('expertise').nullable();     // New expertise column
   table.array('favorites').nullable();     // New favorites column
 });


};

exports.down = function(knex) {
 return knex.schema.alterTable('users', function(table) {
   table.dropColumn('phone');
   table.dropColumn('gender');
   table.dropColumn('expertise');
   table.dropColumn('favorites');
 });
};

