class AlibisController < ApplicationController
  before_action :set_alibi, only: [:show, :edit, :update, :destroy]
  protect_from_forgery except: :add

  # GET /alibis
  # GET /alibis.json
  def index
    @alibis = Alibi.all
  end

  # GET /alibis/1
  # GET /alibis/1.json
  def show
  end

  # GET /alibis/new
  def new
    @alibi = Alibi.new
  end

  # GET /alibis/1/edit
  def edit
  end

  # POST /alibis
  # POST /alibis.json
  def create
    @alibi = Alibi.new(alibi_params)
    respond_to do |format|
      if @alibi.save
        format.html { redirect_to @alibi, notice: 'Alibi was successfully created.' }
        format.json { render :show, status: :created, location: @alibi }
      else
        format.html { render :new }
        format.json { render json: @alibi.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /alibis/1
  # PATCH/PUT /alibis/1.json
  def update
    respond_to do |format|
      if @alibi.update(alibi_params)
        format.html { redirect_to @alibi, notice: 'Alibi was successfully updated.' }
        format.json { render :show, status: :ok, location: @alibi }
      else
        format.html { render :edit }
        format.json { render json: @alibi.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /alibis/1
  # DELETE /alibis/1.json
  def destroy
    @alibi.destroy
    respond_to do |format|
      format.html { redirect_to alibis_url, notice: 'Alibi was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  def add
    @alibi = Alibi.create(route_object: params[:route_object],dep_time: params[:departure],user_id: current_user.uid)
    render text: @alibi.id
  end

  def delete_alibi
    Alibi.delete(["id = ?",params[:id]])
    render nothing: true
  end

  def get_alibis
    current_users_alibis = Alibi.where(user_id: current_user.uid)
    render json: current_users_alibis
  end
  def update_alibi
    Alibi.update(params[:id],dep_time: params[:departure], route_object: params[:route_object])
    Twicont.delete_all(["alibi_id = ?",params[:id]])
    render nothing: true
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_alibi
      @alibi = Alibi.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def alibi_params
      params.require(:alibi).permit(:dep_time, :route_object, :user_id)
    end
end
