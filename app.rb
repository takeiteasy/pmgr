require 'sinatra'
require 'redis'
require 'json'
require 'securerandom'

$db = Redis.new
$categories = [:projects, :notes]

def menu
  $categories.zip($categories.map do |cat|
    $db.smembers(cat).map do |id|
      {:id => id}.merge $db.hgetall(id)
    end
  end).to_h
end

def ext type
  type == 'projects' ? 'json' : 'md'
end

get '/' do
  erb :index, :locals => {:keys => menu}
end

post '/api/add' do
  data = JSON.parse request.body.read
  id = SecureRandom.uuid
  data['id'] = id
  $db.hmset id, :title, data['title'], :type, data['type']
  $db.sadd data['type'], id
  File.open("public/data/#{id}.#{ext data['type']}", 'w') {}
  return data.to_json
end

post '/api/del' do
end

post '/api/update/:id' do
end

get '/api/get/:id' do
  return $db.hgetall(params['id']).to_json
end