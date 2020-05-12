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

def ezget id
  e = $db.hgetall id
  t = e['type']
  return id, t, "public/data/#{id}.#{ext t}"
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
  data.to_json
end

get '/api/del/:id' do
  id, type, fp = ezget params['id']
  File.delete fp if File.exist? fp
  $db.del id
  $db.srem type, id
end

post '/api/save/:id' do
  id, type, fp = ezget params['id']
  File.open(fp, 'w') do |fh|
    fh.write request.body.read
  end
  return '' # TODO: Proper API returns {status: X, ...}
end

post '/api/update/:id/:key/:value' do
end

get '/api/get/:id' do
  $db.hgetall(params['id']).to_json
end