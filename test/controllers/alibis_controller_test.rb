require 'test_helper'

class AlibisControllerTest < ActionController::TestCase
  setup do
    @alibi = alibis(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:alibis)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create alibi" do
    assert_difference('Alibi.count') do
      post :create, alibi: { dep_time: @alibi.dep_time, route_object: @alibi.route_object, user_id: @alibi.user_id }
    end

    assert_redirected_to alibi_path(assigns(:alibi))
  end

  test "should show alibi" do
    get :show, id: @alibi
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @alibi
    assert_response :success
  end

  test "should update alibi" do
    patch :update, id: @alibi, alibi: { dep_time: @alibi.dep_time, route_object: @alibi.route_object, user_id: @alibi.user_id }
    assert_redirected_to alibi_path(assigns(:alibi))
  end

  test "should destroy alibi" do
    assert_difference('Alibi.count', -1) do
      delete :destroy, id: @alibi
    end

    assert_redirected_to alibis_path
  end
end
