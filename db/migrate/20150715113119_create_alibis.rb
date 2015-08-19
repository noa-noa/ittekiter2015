class CreateAlibis < ActiveRecord::Migration
  def change
    create_table :alibis do |t|
      t.datetime :dep_time
      t.string :route_object
      t.string :user_id

      t.timestamps null: false
    end
  end
end
