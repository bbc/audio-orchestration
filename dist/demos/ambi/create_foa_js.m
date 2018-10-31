% function create_foa_js(filename_in, filename_out)
%
% Read a given 8-channel audio file and create a JavaScript file containing the
% first-order ambisonics to binaural filter coefficient data.
% Assumes that the audio file contains binaural pairs of channels in the AmbiX
% order.
%
function create_foa_js(filename_in, filename_out)

x=audioread(filename_in);

num_ir = 4;
num_ch = num_ir*2;
ir_len = size(x,1);

assert(size(x,2)==num_ch, ['Input audio file must contain ',num2str(num_ch),' channels']);

degs=[0,1,1,1];
ords=[0,-1,0,1];

f = fopen(filename_out,'w');
fprintf(f, 'var hrtfs = \n[\n');
for ii = 1:num_ir
  fprintf(f, '  {\n    ''degree'': ');
  fprintf(f, num2str(degs(ii)));
  fprintf(f, ',\n    ''order'': ');
  fprintf(f, num2str(ords(ii)));
  fprintf(f, ',\n    ''fir_coeffs_left'': [\n');
  for jj = 1:ir_len
      fprintf(f, '     ');
      if (x(jj,(ii-1)*2+1) > 0)
          fprintf(f,' ');
      end
      fprintf(f, '%.7f,\n', x(jj,(ii-1)*2+1));
  end
  fprintf(f, '    ],\n    ''fir_coeffs_right'': [\n');
  for jj = 1:ir_len
      fprintf(f, '     ');
      if (x(jj,(ii-1)*2+2) > 0)
          fprintf(f,' ');
      end
      fprintf(f, '%.7f,\n', x(jj,(ii-1)*2+2));
  end
  fprintf(f, '    ],\n  },\n');
end
fprintf(f,']\n');
fclose(f);
