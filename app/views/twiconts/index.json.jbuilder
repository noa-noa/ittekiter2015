json.array!(@twiconts) do |twicont|
  json.extract! twicont, :id, :twidt, :twict, :alibi_id, :user_id
  json.url twicont_url(twicont, format: :json)
end
