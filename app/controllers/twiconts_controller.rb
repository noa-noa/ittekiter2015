class TwicontsController < ApplicationController
	protect_from_forgery except: :add_tweet

	def add_tweet
		@twicont = Twicont.create(twidt: params[:tim],twict: params[:text],twilng: params[:lng],twilat: params[:lat],user_id: current_user.uid,alibi_id:params[:ali],name: params[:name])
		render text: @twicont.id
	end

    def delete_tweet
    	Twicont.delete_all(["id = ?",params[:id]])
    	render nothing: true
    end

	def get_tweet
		@tweet = Twicont.where(alibi_id: params[:id])
		render json: @tweet
	end

	def update_tweet
		Twicont.update(params[:id], twidt: params[:tim], twict: params[:text])
		render nothing: true		
	end
	
end
